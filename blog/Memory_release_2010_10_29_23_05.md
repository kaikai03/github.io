Title: release
Date: 2010-10-29 23:05
Modified: 2010-10-29 23:05
Category: iDev
Tags: Object-C,Memory,iOS
Slug: Memory_release_2010_10_29_23_05
Authors: kai_kai03
Summary: 不是发布的release，这是有关内存release的记录和吐槽。

## 关于释放 ##

`multable`的`addobject`会导致参数对象`retain`，施放时注意。

线程中需要有自己的`autoreleasepool`，`autorelease`对象才会如你预期的被释放。

自己写set方法，自己写retain！

`removeobject`会导致objectAtIndex出来的对象失效，注意remove的实际。（这是当然的，那个只是个指针）

注意Runloop的释放问题。

该死的cocoa，`release`到真正释放效率有很大的问题。目前有两个分别是25ms、50ms的loop它就释放不过来了。

自建pool是一个解决loop内存释放效率不够的好办法，当收到内存警告时，把loop和pool一起释放掉，整个大内存块会被一次性释放掉，再重建一个loop。

`NSInvocationOperation`之类的东西会使它所在的对象`retainCount`+1。

最后，不要相信NS对象的线程安全！！！！！

