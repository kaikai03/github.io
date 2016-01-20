Title: iPad软件提交
Date: 2011-11-18 01:31
Modified: 2011-11-18 01:31
Category: iDev
Tags: appstore,iPad,review,iOS
Slug: iPad_for_review_2011_11_18_01_31
Authors: stlau
Summary: 注意事项 

## 这几天忙着提交ipad的app，被拒，修改，再提交。。。

根据我的经验总结了一些注意事项，其实这些东东HIG里面都有提到。

肯定会被拒的情况：

* app命名：不要用**类似pad的名字**，但可以用**xxx for iPad**，**xxx iPad version**之类的名字；
* popover相关：
 + 除非处于任务编辑状态，popover应该随时可以通过点他范围之外的地方来dismiss掉，换句话说，不要用modal方式；
 + 不要太大，宽度不要超过600；
 + pickerview啥的一定要放在popover里面，宽度不要拉长
 + alertview也要用popover的方式出来


* 尽量不要使用全屏切换效果（我用了flip导致被拒，不知道curl行不行），好像一定要用全屏的话，可以用modal的方式，这一点我也理解的不是很明白；


* 不会导致被拒但是建议改进的：
+ 尽量支持4个方向
+ 少用alertview和全屏视图切换
+ 尽量多用ipad相关的UI element，popover,splitview啥的


总的感觉，审核比较注重要体现出他和iphone app的不同之处，以及保证用户体验的流畅性。