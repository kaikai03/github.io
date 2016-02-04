Title: Python Memory Management(2)
Date: 2014-09-10 23:17
Modified: 2014-09-10 23:17
Category: pyDev
Tags: Memory,Features,Python
Slug: Python_Memory_Management_2014_09_10_23_17
Authors: wklken
Summary: Python源码阅读-内存管理机制(二) 

## Python 的内存分配策略 ##

### arena ###
多个pool聚合的结果。

### arena size ###
pool的大小默认值位4KB

arena的大小默认值256KB, 能放置 256/4=64 个pool

*obmalloc.c*中代码：

	#define ARENA_SIZE              (256 << 10)     /* 256KB */

### arena 结构 ###
> 一个完整的arena = arena_object + pool集合

	typedef uchar block;
	
	/* Record keeping for arenas. */
	struct arena_object {
		/* The address of the arena, as returned by malloc.  Note that 0
	     * will never be returned by a successful malloc, and is used
	     * here to mark an arena_object that doesn't correspond to an
	     * allocated arena.
	     */
		uptr address;
	
	    /* Pool-aligned pointer to the next pool to be carved off. */
	    block* pool_address;
	
	    /* The number of available pools in the arena:  free pools + never-
	     * allocated pools.
	     */
	    uint nfreepools;
	
	    /* The total number of pools in the arena, whether or not available. */
	    uint ntotalpools;
	
	    /* Singly-linked list of available pools. */
	    // 单链表, 可用pool集合
	    struct pool_header* freepools;
	
	    /* Whenever this arena_object is not associated with an allocated
	     * arena, the nextarena member is used to link all unassociated
	     * arena_objects in the singly-linked `unused_arena_objects` list.
	     * The prevarena member is unused in this case.
	     *
	     * When this arena_object is associated with an allocated arena
	     * with at least one available pool, both members are used in the
	     * doubly-linked `usable_arenas` list, which is maintained in
	     * increasing order of `nfreepools` values.
	     *
	     * Else this arena_object is associated with an allocated arena
	     * all of whose pools are in use.  `nextarena` and `prevarena`
	     * are both meaningless in this case.
	     */
	    // arena链表
	    struct arena_object* nextarena;
	    struct arena_object* prevarena;
	};

arena_object的作用:

* 与其他arena连接, 组成双向链表
* 维护arena中可用的pool, 单链表
* 其他信息

`pool_header` 与 `arena_object`

* pool\_header和管理的blocks内存是一块连续的内存 => pool\_header被申请时, 其管理的block集合的内存一并被申请
* arena\_object和其管理的内存是分离的 => arena\_object被申请时, 其管理的pool集合的内存没有被申请, 而是在某一时刻建立的联系

<center>![]({filename}/article_img/Python_Memory_Management_2014_09_10_23_17/python-memory-arena.png)</center>

### arena的两种状态 ###

arena存在两种状态: 未使用(没有建立联系)/可用(建立了联系)

全局由两个链表维护着

	/* The head of the singly-linked, NULL-terminated list of available
	 * arena_objects.
	 */
	// 单链表
	static struct arena_object* unused_arena_objects = NULL;
	
	/* The head of the doubly-linked, NULL-terminated at each end, list of
	 * arena_objects associated with arenas that have pools available.
	 */
	// 双向链表
	static struct arena_object* usable_arenas = NULL;

### arena的初始化 ###

首先, 来看下初始化相关的一些参数定义
代码*obmalloc.c*

	/* Array of objects used to track chunks of memory (arenas). */
	// arena_object 数组
	static struct arena_object* arenas = NULL;
	
	/* Number of slots currently allocated in the `arenas` vector. */
	// 当前arenas中管理的arena_object的个数, 初始化时=0
	static uint maxarenas = 0;
	
	/* How many arena_objects do we initially allocate?
	 * 16 = can allocate 16 arenas = 16 * ARENA_SIZE = 4MB before growing the
	 * `arenas` vector.
	 */
	// 初始化时申请的arena_object个数
	#define INITIAL_ARENA_OBJECTS 16
	
	/* Number of arenas allocated that haven't been free()'d. */
	static size_t narenas_currently_allocated = 0;
	
	
	/* The head of the singly-linked, NULL-terminated list of available
	 * arena_objects.
	 */
	// 未使用状态arena的单链表
	static struct arena_object* unused_arena_objects = NULL;
	
	/* The head of the doubly-linked, NULL-terminated at each end, list of
	 * arena_objects associated with arenas that have pools available.
	 */
	// 可用状态arena的双向链表
	static struct arena_object* usable_arenas = NULL;

然后, 看下*obmalloc.c*中arena初始化的代码

	/* Allocate a new arena.  If we run out of memory, return NULL.  Else
	 * allocate a new arena, and return the address of an arena_object
	 * describing the new arena.  It's expected that the caller will set
	 * `usable_arenas` to the return value.
	 */
	static struct arena_object*
	new_arena(void)
	{
	    struct arena_object* arenaobj;
	    uint excess;        /* number of bytes above pool alignment */
	    void *address;
	    int err;
	
	    // 判断是否需要扩充"未使用"的arena_object列表
	    if (unused_arena_objects == NULL) {
	        uint i;
	        uint numarenas;
	        size_t nbytes;
	
	        /* Double the number of arena objects on each allocation.
	         * Note that it's possible for `numarenas` to overflow.
	         */
	        // 确定需要申请的个数, 首次初始化, 16, 之后每次翻倍
	        numarenas = maxarenas ? maxarenas << 1 : INITIAL_ARENA_OBJECTS;
	        if (numarenas <= maxarenas)
	            return NULL;                /* overflow */  //溢出了
	
	        ....
	
	        nbytes = numarenas * sizeof(*arenas);
	        // 申请内存
	        arenaobj = (struct arena_object *)realloc(arenas, nbytes);
	        if (arenaobj == NULL)
	            return NULL;
	        arenas = arenaobj;
	
	        /* We might need to fix pointers that were copied.  However,
	         * new_arena only gets called when all the pages in the
	         * previous arenas are full.  Thus, there are *no* pointers
	         * into the old array. Thus, we don't have to worry about
	         * invalid pointers.  Just to be sure, some asserts:
	         */
	        assert(usable_arenas == NULL);
	        assert(unused_arena_objects == NULL);
	
	        // 初始化
	        /* Put the new arenas on the unused_arena_objects list. */
	        for (i = maxarenas; i < numarenas; ++i) {
	            arenas[i].address = 0;              /* mark as unassociated */
	            // 新申请的一律为0, 标识着这个arena处于"未使用"
	            arenas[i].nextarena = i < numarenas - 1 ?
	                                   &arenas[i+1] : NULL;
	        }
	
	        // 将其放入unused_arena_objects链表中
	        // unused_arena_objects 为新分配内存空间的开头
	        /* Update globals. */
	        unused_arena_objects = &arenas[maxarenas];
	
	        // 更新数量
	        maxarenas = numarenas;
	    }
	
	    /* Take the next available arena object off the head of the list. */
	    assert(unused_arena_objects != NULL);
	
	    // 从unused_arena_objects中, 获取一个未使用的object
	    arenaobj = unused_arena_objects;
	    unused_arena_objects = arenaobj->nextarena; // 更新链表
	
	    // 开始处理这个 arenaobject
	
	    assert(arenaobj->address == 0);
	    // 申请内存, 256KB, 内存地址赋值给arena的address. 这块内存可用
	#ifdef ARENAS_USE_MMAP
	    address = mmap(NULL, ARENA_SIZE, PROT_READ|PROT_WRITE,
	                   MAP_PRIVATE|MAP_ANONYMOUS, -1, 0);
	    err = (address == MAP_FAILED);
	#else
	    address = malloc(ARENA_SIZE);
	    err = (address == 0);
	#endif
	    if (err) {
	        /* The allocation failed: return NULL after putting the
	         * arenaobj back.
	         */
	        arenaobj->nextarena = unused_arena_objects;
	        unused_arena_objects = arenaobj;
	        return NULL;
	    }
	    arenaobj->address = (uptr)address;
	
	    ++narenas_currently_allocated;
	
	    // 设置pool集合相关信息
	    arenaobj->freepools = NULL;  // 设置为NULL, 只有在释放一个pool的时候才有用
	    /* pool_address <- first pool-aligned address in the arena
	       nfreepools <- number of whole pools that fit after alignment */
	    arenaobj->pool_address = (block*)arenaobj->address;
	    arenaobj->nfreepools = ARENA_SIZE / POOL_SIZE;
	
	    assert(POOL_SIZE * arenaobj->nfreepools == ARENA_SIZE);
	
	    // 将pool的起始地址调整为系统页的边界
	    // 申请到 256KB, 放弃了一些内存, 而将可使用的内存边界pool_address调整到了与系统页对齐
	    excess = (uint)(arenaobj->address & POOL_SIZE_MASK);
	    if (excess != 0) {
	        --arenaobj->nfreepools;
	        arenaobj->pool_address += POOL_SIZE - excess;
	    }
	    arenaobj->ntotalpools = arenaobj->nfreepools;
	
	    return arenaobj;
	}

图示: 初始化arenas数组, 初始化后的所有arena都在`unused_arena_objects`单链表里面
<center>![]({filename}/article_img/Python_Memory_Management_2014_09_10_23_17/python-memory-arena2.png)</center>
图示: 从arenas取一个arena进行初始化
<center>![]({filename}/article_img/Python_Memory_Management_2014_09_10_23_17/python-memory-arena3.png)</center>

### 没有可用的arena? ###
此时
   
	// 判断成立
    if (unused_arena_objects == NULL) {
        ....
        // 确定需要申请的个数, 首次初始化, 16, 之后每次翻倍
        numarenas = maxarenas ? maxarenas << 1 : INITIAL_ARENA_OBJECTS;

然后, 假设第一次分配了16个, 发现没有arena之后, 第二次处理结果: `numarenas = 32`

即, 数组扩大了一倍。

### arena分配 ###

`new`了一个全新的 arena之后,

	  void *
	  PyObject_Malloc(size_t nbytes)
	  {
		// 刚开始没有可用的arena
		if (usable_arenas == NULL) {
			// new一个, 作为双向链表的表头
			usable_arenas = new_arena();
			if (usable_arenas == NULL) {
				UNLOCK();
				goto redirect;
			}
	
			usable_arenas->nextarena =
	                  usable_arenas->prevarena = NULL;
	
		}
	
		.......
	
		// 从arena中获取一个pool
		pool = (poolp)usable_arenas->pool_address;
		assert((block*)pool <= (block*)usable_arenas->address +
	                                 ARENA_SIZE - POOL_SIZE);
		pool->arenaindex = usable_arenas - arenas;
		assert(&arenas[pool->arenaindex] == usable_arenas);
		pool->szidx = DUMMY_SIZE_IDX;
	
		// 更新 pool_address 向下一个节点
		usable_arenas->pool_address += POOL_SIZE;
		// 可用节点数量-1
		--usable_arenas->nfreepools;
	}

图示: 从全新的arena中获取一个pool

<center>![]({filename}/article_img/Python_Memory_Management_2014_09_10_23_17/python-memory-arena4.png)</center>

假设arena是旧的, 怎么分配的pool

	pool = usable_arenas->freepools;
	if (pool != NULL) {

这个arena->freepools是何方神圣?

当arena中一整块pool被释放的时候:

	void
	PyObject_Free(void *p)
	{
		struct arena_object* ao;
		uint nf;  /* ao->nfreepools */
	
		/* Link the pool to freepools.  This is a singly-linked
		* list, and pool->prevpool isn't used there.
		*/
		ao = &arenas[pool->arenaindex];
		pool->nextpool = ao->freepools;
		ao->freepools = pool;
		nf = ++ao->nfreepools;

也就是说, 在pool整块被释放的时候, 会将pool加入到`arena->freepools`作为单链表的表头, 然后, 在从非全新arena中分配pool时, 优先从`arena->freepools`里面取, 如果取不到, 再从arena内存块里面获取。

图示


<center>![]({filename}/article_img/Python_Memory_Management_2014_09_10_23_17/python-memory-arena5.png)</center>

### 一个arena满了之后呢 ###

很自然, 从下一个arena中获取

	void *
	PyObject_Malloc(size_t nbytes)
	{
		// 当发现用完了最后一个pool!!!!!!!!!!!
		// nfreepools = 0
		if (usable_arenas->nfreepools == 0) {
		assert(usable_arenas->nextarena == NULL || usable_arenas->nextarena->prevarena == usable_arenas);
		/* Unlink the arena:  it is completely allocated. */
	
		// 找到下一个节点!
		usable_arenas = usable_arenas->nextarena;
		// 右下一个
		if (usable_arenas != NULL) {
			usable_arenas->prevarena = NULL; // 更新下一个节点的prevarens
			assert(usable_arenas->address != 0);
		}
		// 没有下一个, 此时 usable_arenas = NULL, 下次进行内存分配的时候, 就会从arenas数组中取一个
		}
	}

注意: 这里有个逻辑, 就是每分配一个pool, 就检查是不是用到了最后一个, 如果是, 需要变更`usable_arenas`到下一个可用的节点, 如果没有可用的, 那么下次进行内存分配的时候, 会判定从arenas数组中取一个。

### arena回收 ###

内存分配和回收最小单位是block, 当一个block被回收的时候, 可能触发pool被回收, pool被回收, 将会触发arena的回收机制。

四种情况：

1. arena中所有pool都是闲置的(empty), 将arena内存释放, 返回给操作系统。
2. 如果arena中之前所有的pool都是占用的(used), 现在释放了一个pool(empty), 需要将 arena加入到usable_arenas, 会加入链表表头。
3. 如果arena中empty的pool个数n, 则从useable_arenas开始寻找可以插入的位置. 将arena插入。 (useable_arenas是一个有序链表, 按empty pool的个数, 保证empty pool数量越多, 被使用的几率越小, 最终被整体释放的机会越大)
4. 其他情况, 不对arena 进行处理。

具体可以看`PyObject_Free`的代码。

## 内存分配步骤 ##
好的, 到这里, 我们已经知道了block和pool的关系(包括pool怎么管理block的), 以及arena和pool的关系(怎么从arena中拉到可用的pool)

那么, 在分析`PyObject_Malloc(size_t nbytes)`如何进行内存分配的时候, 我们就刨除掉这些管理代码。

关注: 如何寻找得到一块可用的nbytes的block内存。

其实代码那么多, 寻址得到对应的block也就这么几行代码, 其他代码都是pool没有, 找arena, 申请arena, arena没有, 找arenas, 最终的到一块pool, 初始化, 返回第一个block。

如果有的情况, 用现成的:

	pool = usedpools[size + size];
	if pool可用:
	    pool 没满, 取一个block返回
	    pool 满了, 从下一个pool取一个block返回
	否则:
	    获取arena, 从里面初始化一个pool, 拿到第一个block, 返回

从上面这个判断逻辑来看, 内存分配其实主要操作的是pool, 跟arena并不是基本的操作单元(只是用来管理pool的)

结论: 进行内存分配和销毁, 所有操作都是在pool上进行的。
`usedpools` 是什么鬼? 其实是可用pool缓冲池, 后面说。

## 内存池 ##

### arena 内存池的大小 ###
取决于用户, Python提供的编译符号, 用于决定是否控制。

*obmalloc.c*

	#ifdef WITH_MEMORY_LIMITS
	#ifndef SMALL_MEMORY_LIMIT
	#define SMALL_MEMORY_LIMIT      (64 * 1024 * 1024)      /* 64 MB -- more? */
	#endif
	#endif
	
	#ifdef WITH_MEMORY_LIMITS
	#define MAX_ARENAS              (SMALL_MEMORY_LIMIT / ARENA_SIZE)
	#endif

具体使用中, python并不直接与arenas和arena打交道, 当Python申请内存时, 最基本的操作单元并不是arena, 而是pool。

问题: pool中所有block的size一样, 但是在arena中, 每个pool的size都可能不一样, 那么最终这些pool是怎么维护的? 怎么根据大小找到需要的block所在的pool? => usedpools

### pool在内存池中的三种状态 ###

1. used状态: pool中至少有一个block已经被使用, 并且至少有一个block未被使用. 这种状态的pool受控于Python内部维护的usedpool数组。

2. full状态: pool中所有的block都已经被使用, 这种状态的pool在arena中, 但不在arena的freepools链表中
处于full的pool各自独立, 不会被链表维护起来。

3. empty状态: pool中所有block都未被使用, 处于这个状态的pool的集合通过其pool\_header中的nextpool构成一个链表, 链表的表头是arena\_object中的freepools。

### usedpools ###
usedpools数组: 维护着所有处于used状态的pool, 当申请内存的时候, 会通过usedpools寻找到一块可用的(处于used状态的)pool, 从中分配一个block。

结构:

	  #define SMALL_REQUEST_THRESHOLD 512
	  // 512/8 = 64
	  #define NB_SMALL_SIZE_CLASSES   (SMALL_REQUEST_THRESHOLD / ALIGNMENT)
	
	  #define PTA(x)  ((poolp )((uchar *)&(usedpools[2*(x)]) - 2*sizeof(block *)))
	  #define PT(x)   PTA(x), PTA(x)
	
	  // 2 * ((64 + 7) / 8) * 8 = 128, 大小为128的数组
	  static poolp usedpools[2 * ((NB_SMALL_SIZE_CLASSES + 7) / 8) * 8] = {
	      PT(0), PT(1), PT(2), PT(3), PT(4), PT(5), PT(6), PT(7)
	  #if NB_SMALL_SIZE_CLASSES > 8
	      , PT(8), PT(9), PT(10), PT(11), PT(12), PT(13), PT(14), PT(15)
	  #if NB_SMALL_SIZE_CLASSES > 16
	      , PT(16), PT(17), PT(18), PT(19), PT(20), PT(21), PT(22), PT(23)
	  #if NB_SMALL_SIZE_CLASSES > 24
	      , PT(24), PT(25), PT(26), PT(27), PT(28), PT(29), PT(30), PT(31)
	  #if NB_SMALL_SIZE_CLASSES > 32
	      , PT(32), PT(33), PT(34), PT(35), PT(36), PT(37), PT(38), PT(39)
	  #if NB_SMALL_SIZE_CLASSES > 40
	      , PT(40), PT(41), PT(42), PT(43), PT(44), PT(45), PT(46), PT(47)
	  #if NB_SMALL_SIZE_CLASSES > 48
	      , PT(48), PT(49), PT(50), PT(51), PT(52), PT(53), PT(54), PT(55)
	  #if NB_SMALL_SIZE_CLASSES > 56
	      , PT(56), PT(57), PT(58), PT(59), PT(60), PT(61), PT(62), PT(63)
	  #if NB_SMALL_SIZE_CLASSES > 64
	  #error "NB_SMALL_SIZE_CLASSES should be less than 64"
	  #endif /* NB_SMALL_SIZE_CLASSES > 64 */
	  #endif /* NB_SMALL_SIZE_CLASSES > 56 */
	  #endif /* NB_SMALL_SIZE_CLASSES > 48 */
	  #endif /* NB_SMALL_SIZE_CLASSES > 40 */
	  #endif /* NB_SMALL_SIZE_CLASSES > 32 */
	  #endif /* NB_SMALL_SIZE_CLASSES > 24 */
	  #endif /* NB_SMALL_SIZE_CLASSES > 16 */
	  #endif /* NB_SMALL_SIZE_CLASSES >  8 */
	  };
	
	  即
	
	  // 得到usedpools数组
	static poolp usedpools[128] = {
	   PTA(0), PTA(0), PTA(1), PTA(1), PTA(2), PTA(2), PTA(3), PTA(3),
	   ....
	   PTA(63), PTA(63)
	}

解开看(*obmalloc.c*)

	  typedef uchar block;
	
	  /* Pool for small blocks. */
	  struct pool_header {
	      union { block *_padding;
	              uint count; } ref;          /* number of allocated blocks    */
	      block *freeblock;                   /* pool's free list head         */
	      struct pool_header *nextpool;       /* next pool of this size class  */
	      struct pool_header *prevpool;       /* previous pool       ""        */
	      uint arenaindex;                    /* index into arenas of base adr */
	      uint szidx;                         /* block size class index        */
	      uint nextoffset;                    /* bytes to virgin block         */
	      uint maxnextoffset;                 /* largest valid nextoffset      */
	  };
	  typedef struct pool_header *poolp;
	  usedpools[0] = PTA(0) = ((poolp )((uchar *)&(usedpools[0]) - 2*sizeof(block *)))
	  usedpools[1] = PTA(0) = ((poolp )((uchar *)&(usedpools[0]) - 2*sizeof(block *)))
	
	
	
	  *p = usedpools[0] => p->nextpool and p->prevpool are both p

为了看懂这步的trick, 心好累>_<#

直接上图：

<center>![]({filename}/article_img/Python_Memory_Management_2014_09_10_23_17/python-memory-usedpool.png)</center>

### new一个pool时维护 ###

init获得的情况, 其实就是将刚刚从arena中获取的pool加入到 usedpools 对应的双向链表中, 然后初始化, 然后返回block。

         init_pool:
              /* Frontlink to used pools. */

              // 1. 获取得到usedpools链表头
              next = usedpools[size + size]; /* == prev */

              // 2. 将新的pool加入到双向链表
              pool->nextpool = next;
              pool->prevpool = next;
              next->nextpool = pool;
              next->prevpool = pool;
              pool->ref.count = 1;

              // 3. 后面的是具体pool和block的了
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
              pool->szidx = size;
              size = INDEX2SIZE(size);
              bp = (block *)pool + POOL_OVERHEAD;
              pool->nextoffset = POOL_OVERHEAD + (size << 1);
              pool->maxnextoffset = POOL_SIZE - size;
              pool->freeblock = bp + size;
              *(block **)(pool->freeblock) = NULL;
              UNLOCK();
              return (void *)bp;   // here
          }

### 从现有pool中获取block ###
从现有的pool, 其实就是 usedpools得到双向链表头部, 判断是不是空链表, 不是的话代表有可用的pool, 直接从里面获取。

      if ((nbytes - 1) < SMALL_REQUEST_THRESHOLD) {
          LOCK();
          /*
           * Most frequent paths first
           */
          size = (uint)(nbytes - 1) >> ALIGNMENT_SHIFT;
          pool = usedpools[size + size];

          // 注意这里的判断, pool != pool-> nextpool 表示得到的链表不是空的
          if (pool != pool->nextpool) {
              /*
               * There is a used pool for this size class.
               * Pick up the head block of its free list.
               */
              ++pool->ref.count;
              bp = pool->freeblock;
              assert(bp != NULL);
              if ((pool->freeblock = *(block **)bp) != NULL) {
                  UNLOCK();
                  return (void *)bp;
              }
              /*
               * Reached the end of the free list, try to extend it.
               */
              if (pool->nextoffset <= pool->maxnextoffset) {
                  /* There is room for another block. */
                  pool->freeblock = (block*)pool +
                                    pool->nextoffset;
                  pool->nextoffset += INDEX2SIZE(size);
                  *(block **)(pool->freeblock) = NULL;
                  UNLOCK();
                  return (void *)bp;
              }
              /* Pool is full, unlink from used pools. */
              next = pool->nextpool;
              pool = pool->prevpool;
              next->prevpool = pool;
              pool->nextpool = next;
              UNLOCK();
              return (void *)bp;   // here
          }

### 全局结构 ###

<center>![]({filename}/article_img/Python_Memory_Management_2014_09_10_23_17/python-memory-usedpool2.png)</center>

---------------------------------------------
先这样吧, Python中整个内存池基本结构和机制大概如此, 是不是发现有好多数组/链表等等, 在分配/回收上处理下做成各种池.....
后面还有内存相关的就是垃圾收集了, 后面再说了吧wklken2015-08-29

--------------------------------------
 版权声明：自由转载-非商用-非衍生-保持署名 | Creative Commons BY-NC-ND 3.0 