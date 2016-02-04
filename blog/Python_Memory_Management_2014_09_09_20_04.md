Title: Python Memory Management(1)
Date: 2014-09-09 20:04
Modified: 2014-09-09 20:04
Category: pyDev
Tags: Memory,Features,Python
Slug: Python_Memory_Management_2014_09_09_20_04
Authors: wklken
Summary: Python源码阅读-内存管理机制(一) 

## Python的内存管理架构 ##

### 基本分层 ###

在Objects/obmalloc.c源码中, 给了一个分层划分

	    _____   ______   ______       ________
	   [ int ] [ dict ] [ list ] ... [ string ]       Python core         |
	+3 | <----- Object-specific memory -----> | <-- Non-object memory --> |
	    _______________________________       |                           |
	   [   Python's object allocator   ]      |                           |
	+2 | ####### Object memory ####### | <------ Internal buffers ------> |
	    ______________________________________________________________    |
	   [          Python's raw memory allocator (PyMem_ API)          ]   |
	+1 | <----- Python memory (under PyMem manager's control) ------> |   |
	    __________________________________________________________________
	   [    Underlying general-purpose allocator (ex: C library malloc)   ]
	 0 | <------ Virtual memory allocated for the python process -------> |
	
	   =========================================================================
	    _______________________________________________________________________
	   [                OS-specific Virtual Memory Manager (VMM)               ]
	-1 | <--- Kernel dynamic storage allocation & management (page-based) ---> |
	    __________________________________   __________________________________
	   [                                  ] [                                  ]
	-2 | <-- Physical memory: ROM/RAM --> | | <-- Secondary storage (swap) --> |

可以看到

	layer 3: Object-specific memory(int/dict/list/string....)
	         Python 实现并维护
	         更高抽象层次的内存管理策略, 主要是各类特定对象的缓冲池机制. 具体见前面几篇涉及的内存分配机制
	
	layer 2: Python's object allocator
	         Python 实现并维护
	         实现了创建/销毁Python对象的接口(PyObject_New/Del), 涉及对象参数/引用计数等
	
	layer 1: Python's raw memory allocator (PyMem_ API)
	         Python 实现并维护, 包装了第0层的内存管理接口, 提供统一的raw memory管理接口
	         封装的原因: 不同操作系统 C 行为不一定一致, 保证可移植性, 相同语义相同行为
	
	layer 0: Underlying general-purpose allocator (ex: C library malloc)
	         操作系统提供的内存管理接口, 由操作系统实现并管理, Python不能干涉这一层的行为

第三层layer 3前面已经介绍过了, 几乎每种常用的数据类型都伴有一套缓冲池机制。

在这里, 我们关注的是layer 2/1，

简要介绍下layer 1, 然后重点关注layer 2, 这才是重点。

### layer 1: PyMem_ API ###

`PyMem_ API`是对操作系统内存管理接口进行的封装

查看pymem.h可以看到
	
	// Raw memory interface
	// 这里存在三个宏定义, 宏可以避免一次函数调用的开销, 提高运行效率
	// 不允许非配空间大小为0的内存空间
	#define PyMem_MALLOC(n)     ((size_t)(n) > (size_t)PY_SSIZE_T_MAX ? NULL \
	                : malloc((n) ? (n) : 1))
	
	
	#define PyMem_REALLOC(p, n) ((size_t)(n) > (size_t)PY_SSIZE_T_MAX  ? NULL \
	                : realloc((p), (n) ? (n) : 1))
	#define PyMem_FREE      free
	
	// 这里做了三个函数的声明, 平台独立的 malloc/realloc/free
	PyAPI_FUNC(void *) PyMem_Malloc(size_t);
	PyAPI_FUNC(void *) PyMem_Realloc(void *, size_t);
	PyAPI_FUNC(void) PyMem_Free(void *);
	
	// ============================================================
	
	// Type-oriented memory interface
	// 这里还有三个类型相关的内存接口, 批量分配/重分配 n 个 类型为 type内存
	#define PyMem_New(type, n) \
	  ( ((size_t)(n) > PY_SSIZE_T_MAX / sizeof(type)) ? NULL :  \
	    ( (type *) PyMem_Malloc((n) * sizeof(type)) ) )
	#define PyMem_NEW(type, n) \
	  ( ((size_t)(n) > PY_SSIZE_T_MAX / sizeof(type)) ? NULL :  \
	    ( (type *) PyMem_MALLOC((n) * sizeof(type)) ) )
	
	#define PyMem_Resize(p, type, n) \
	  ( (p) = ((size_t)(n) > PY_SSIZE_T_MAX / sizeof(type)) ? NULL :    \
	    (type *) PyMem_Realloc((p), (n) * sizeof(type)) )
	#define PyMem_RESIZE(p, type, n) \
	  ( (p) = ((size_t)(n) > PY_SSIZE_T_MAX / sizeof(type)) ? NULL :    \
	    (type *) PyMem_REALLOC((p), (n) * sizeof(type)) )

然后`object.c`中, 我们关注实现, 三个实现的函数调用了对应的宏

	// 使用 C 写Python扩展模块时使用函数而不是对应的宏
	void *
	PyMem_Malloc(size_t nbytes)
	{
	    return PyMem_MALLOC(nbytes);
	}
	
	void *
	PyMem_Realloc(void *p, size_t nbytes)
	{
	    return PyMem_REALLOC(p, nbytes);
	}
	
	void
	PyMem_Free(void *p)
	{
	    PyMem_FREE(p);
	}

这些接口都相对简单

好了, 结束, 开始关注layer 2: Python's object allocator。

--------------------------------------------------

## Python 的内存分配策略 ##

先来看Objects/obmalloc.c中的一段注释

	/*
	 * "Memory management is where the rubber meets the road -- if we do the wrong
	 * thing at any level, the results will not be good. And if we don't make the
	 * levels work well together, we are in serious trouble." (1)
	 *
	 * (1) Paul R. Wilson, Mark S. Johnstone, Michael Neely, and David Boles,
	 *    "Dynamic Storage Allocation: A Survey and Critical Review",
	 *    in Proc. 1995 Int'l. Workshop on Memory Management, September 1995.
	 */


Python引入了内存池机制, 用于管理对小块内存的申请和释放

逻辑

* 如果要分配的内存空间大于 SMALL_REQUEST_THRESHOLD bytes(512 bytes), 将直接使用layer 1的内存分配接口进行分配
* 否则, 使用不同的block来满足分配需求

整个小块内存池可以视为一个层次结构

1. 内存池(概念上的, 标识Python对于整个小块内存分配和释放的内存管理机制)
1. arena
1. pool
1. block

### block ###

Python内存的最小单位, 所有block长度都是8字节对齐的。

注意这里block只是一个概念, 在源代码中并没有实体存在。

不同类型block, 对应不同内存大小, 这个内存大小的值被称为size class。

不同长度的block：

	 * Request in bytes     Size of allocated block      Size class idx
	 * ----------------------------------------------------------------
	 *        1-8                     8                       0
	 *        9-16                   16                       1
	 *       17-24                   24                       2
	 *       25-32                   32                       3
	 *       33-40                   40                       4
	 *       41-48                   48                       5
	 *       49-56                   56                       6
	 *       57-64                   64                       7
	 *       65-72                   72                       8
	 *        ...                   ...                     ...
	 *      497-504                 504                      62
	 *      505-512                 512                      63
	 *
	 *      0, SMALL_REQUEST_THRESHOLD + 1 and up: routed to the underlying
	 *      allocator.
	 */

例如

	申请一块大小28字节的内存, 实际从内存中划到32字节的一个block (从size class index为3的pool里面划出)


<center>![]({filename}/article_img/Python_Memory_Management_2014_09_09_20_04/python-memory-blocks.png)</center>

注意: 这里有个`Size class idx`, 这个主要为了后面pool中用到。

size class和size class index之间的转换

	#define ALIGNMENT               8               /* must be 2^N */
	#define ALIGNMENT_SHIFT         3
	#define ALIGNMENT_MASK          (ALIGNMENT - 1)
	
	// size class index => size class
	#define INDEX2SIZE(I) (((uint)(I) + 1) << ALIGNMENT_SHIFT)
	
	/* 即
	    (0+1) * 8 = 8
	    (1+1) * 8 = 16
	*/
	
	// size class => size class index
	size = (uint)(nbytes - 1) >> ALIGNMENT_SHIFT;
	
	/* 即
	    (8 - 1) / 8 = 0
	    (16 - 8) / 8 = 1
	*/

### pool ###

pool管理block, 一个pool管理着一堆有固定大小的内存块

本质: pool管理着一大块内存, 它有一定的策略, 将这块大的内存划分为多个大小一致的小块内存。

### pool size ###

在Python中, 一个pool的大小通常为一个系统内存页， 4kB。

*obmalloc.c*

	#define SYSTEM_PAGE_SIZE        (4 * 1024)
	#define SYSTEM_PAGE_SIZE_MASK   (SYSTEM_PAGE_SIZE - 1)
	
	#define POOL_SIZE               SYSTEM_PAGE_SIZE        /* must be 2^N */
	#define POOL_SIZE_MASK          SYSTEM_PAGE_SIZE_MASK

### pool组成 ###

>pool的4kB内存 = pool_header + block集合(N多大小一样的block)

pool_header
	/* Pool for small blocks. */
	struct pool_header {
	    union { block *_padding;
	            uint count; } ref;          /* number of allocated blocks    */
	    block *freeblock;                   /* pool's free list head         */
	    struct pool_header *nextpool;       /* next pool of this size class  */
	    struct pool_header *prevpool;       /* previous pool       ""        */
	    uint arenaindex;                    /* index into arenas of base adr */
	    uint szidx;                         /* block size class index        */ - size class index
	    uint nextoffset;                    /* bytes to virgin block         */
	    uint maxnextoffset;                 /* largest valid nextoffset      */
	};

pool_header的作用

* 与其他pool链接, 组成双向链表
* 维护pool中可用的block, 单链表
* 保存 szidx , 这个和该pool中block的大小有关系, (block size=8, szidx=0), (block size=16, szidx=1)...用于内存分配时匹配到拥有对应大小block的pool
* arenaindex, 后面说

结构图: 

<center>![]({filename}/article_img/Python_Memory_Management_2014_09_09_20_04/python-memory-pools.png)</center>

### pool初始化 ###

从内存中初始化一个全新的空的`pool`

*Objects/obmalloc.c*的

	void *
	PyObject_Malloc(size_t nbytes)
	{
	  ...
		init_pool:
	    // 1. 连接到 used_pools 双向链表, 作为表头
	    // 注意, 这里 usedpools[0] 保存着 block size = 8 的所有used_pools的表头
	    /* Frontlink to used pools. */
	    next = usedpools[size + size]; /* == prev */
	    pool->nextpool = next;
	    pool->prevpool = next;
	    next->nextpool = pool;
	    next->prevpool = pool;
	    pool->ref.count = 1;
	
	    // 如果已经初始化过了...这里看初始化, 跳过
	    if (pool->szidx == size) {
	    /* Luckily, this pool last contained blocks
	    * of the same size class, so its header
	    * and free list are already initialized.
	    */
	    	bp = pool->freeblock;
	    	pool->freeblock = *(block **)bp;
	    	UNLOCK();
	    	return (void *)bp;
	 	}
	
	
	    /*
	     * Initialize the pool header, set up the free list to
	     * contain just the second block, and return the first
	     * block.
	     */
	    // 开始初始化pool_header
	    // 这里 size = (uint)(nbytes - 1) >> ALIGNMENT_SHIFT;  其实是Size class idx, 即szidx
	    
		pool->szidx = size;
	
	    // 计算获得每个block的size
	    size = INDEX2SIZE(size);
	
	    // 注意 #define POOL_OVERHEAD           ROUNDUP(sizeof(struct pool_header))
	    // bp => 初始化为pool + pool_header size,  跳过pool_header的内存
	    bp = (block *)pool + POOL_OVERHEAD;
	
		// 计算偏移量, 这里的偏移量是绝对值
		// #define POOL_SIZE               SYSTEM_PAGE_SIZE        /* must be 2^N */
		// POOL_SIZE = 4kb, POOL_OVERHEAD = pool_header size
		// 下一个偏移位置: pool_header size + 2 * size
		
		pool->nextoffset = POOL_OVERHEAD + (size << 1);
		// 4kb - size
		pool->maxnextoffset = POOL_SIZE - size;
	
		// freeblock指向 bp + size = pool_header size + size
		pool->freeblock = bp + size;
	
		// 赋值NULL
		*(block **)(pool->freeblock) = NULL;
		UNLOCK();
		return (void *)bp;
	}


初始化后的图

<center>![]({filename}/article_img/Python_Memory_Management_2014_09_09_20_04/python-memory-pools2.png)</center>


### pool进行block分配 - 0 总体代码 ###

     if (pool != pool->nextpool) {   //
		/*
		* There is a used pool for this size class.
		* Pick up the head block of its free list.
		*/
		++pool->ref.count;
		bp = pool->freeblock; // 指针指向空闲block起始位置
		assert(bp != NULL);

		// 代码-1
		// 调整 pool->freeblock (假设A节点)指向链表下一个, 即bp首字节指向的下一个节点(假设B节点) , 如果此时!= NULL
		// 表示 A节点可用, 直接返回
		if ((pool->freeblock = *(block **)bp) != NULL) {
			UNLOCK();
			return (void *)bp;
		}

		// 代码-2
		/*
		* Reached the end of the free list, try to extend it.
		*/
		// 有足够的空间, 分配一个, pool->freeblock 指向后移
		if (pool->nextoffset <= pool->maxnextoffset) {
			/* There is room for another block. */
			// 变更位置信息
			pool->freeblock = (block*)pool +
                                  pool->nextoffset;
			pool->nextoffset += INDEX2SIZE(size);


			*(block **)(pool->freeblock) = NULL; // 注意, 指向NULL
			UNLOCK();

			// 返回bp
			return (void *)bp;
		}

		// 代码-3
		/* Pool is full, unlink from used pools. */  // 满了, 需要从下一个pool获取
		next = pool->nextpool;
		pool = pool->prevpool;
		next->prevpool = pool;
		pool->nextpool = next;
		UNLOCK();
		return (void *)bp;
	}

### pool进行block分配 - 1 刚开始 ###
内存块尚未分配完, 且此时不存在回收的block, 全新进来的时候, 分配第一块block。

	(pool->freeblock = *(block **)bp) == NULL

所以进入的逻辑是代码-2

	bp = pool->freeblock; // 指针指向空闲block起始位置
	
	.....

	
	// 代码-2
	/*
	 * Reached the end of the free list, try to extend it.
	 */
	// 有足够的空间, 分配一个, pool->freeblock 指向后移
	if (pool->nextoffset <= pool->maxnextoffset) {
		/* There is room for another block. */
		// 变更位置信息
		pool->freeblock = (block*)pool +
		pool->nextoffset;
		pool->nextoffset += INDEX2SIZE(size);
	
		*(block **)(pool->freeblock) = NULL; // 注意, 指向NULL
		UNLOCK();
	
		// 返回bp
		return (void *)bp;
	}

结果图示：

<center>![]({filename}/article_img/Python_Memory_Management_2014_09_09_20_04/python-memory-pools3.png)</center>

### pool进行block分配 - 2 回收了某几个block ###
回收涉及的代码

	void
	PyObject_Free(void *p)
	{
	    poolp pool;
	    block *lastfree;
	    poolp next, prev;
	    uint size;
	
	    pool = POOL_ADDR(p);
	    if (Py_ADDRESS_IN_RANGE(p, pool)) {
	        /* We allocated this address. */
	        LOCK();
	        /* Link p to the start of the pool's freeblock list.  Since
	         * the pool had at least the p block outstanding, the pool
	         * wasn't empty (so it's already in a usedpools[] list, or
	         * was full and is in no list -- it's not in the freeblocks
	         * list in any case).
	         */
	        assert(pool->ref.count > 0);            /* else it was empty */
	        // p被释放, p的第一个字节值被设置为当前freeblock的值
	        *(block **)p = lastfree = pool->freeblock;
	        // freeblock被更新为指向p的首地址
	        pool->freeblock = (block *)p;
	
	        // 相当于往list中头插入了一个节点
	
	     ...
	    }
	}

没释放一个block, 该block就会变成 `pool->freeblock` 的头节点, 而单链表一个节点如何指向下一个节点呢? 通过赋值, 节点内存空间保存着下个节点的地址, 最后一个节点指向NULL(知道上面代码-1的判断条件了吧>_<#)

假设已经连续分配了5块, 第1块和第4块被释放

此时内存图示：

<center>![]({filename}/article_img/Python_Memory_Management_2014_09_09_20_04/python-memory-pools4.png)</center>

此时再一个block分配调用进来, 执行分配, 进入的逻辑是代码-1

	bp = pool->freeblock; // 指针指向空闲block起始位置
	// 代码-1
	// 调整 pool->freeblock (假设A节点)指向链表下一个, 即bp首字节指向的下一个节点(假设B节点) , 如果此时!= NULL
	// 表示 A节点可用, 直接返回
	if ((pool->freeblock = *(block **)bp) != NULL) {
		UNLOCK();
		return (void *)bp;
	}


<center>![]({filename}/article_img/Python_Memory_Management_2014_09_09_20_04/python-memory-pools5.png)</center>

### pool进行block分配 - 3 pool用完了 ###
pool中内存空间都用完了, 进入代码-3

	bp = pool->freeblock; // 指针指向空闲block起始位置


	// 代码-3
	/* Pool is full, unlink from used pools. */  // 满了, 需要从下一个pool获取
	next = pool->nextpool;
	pool = pool->prevpool;
	next->prevpool = pool;
	pool->nextpool = next;
	UNLOCK();
	return (void *)bp;

获取下一个pool(链表上每个pool的block size都是一致的)
好了, pool到此位置。

---------------------------------------

 版权声明：自由转载-非商用-非衍生-保持署名 | [Creative Commons BY-NC-ND 3.0](http://creativecommons.org/licenses/by-nc-nd/3.0/deed.zh)