Title: PEP 0498: Literal String Formatting
Date: 2015-08-28 10:20
Modified: 2015-08-28 10:20
Category:pyDev 
Tags: PEP,Python
Slug: Literal_String_Formatting_2015_08_28_10_20
Authors: kai_kai03
Summary: Python 要加插入语法糖

## PEP 0498: Literal String Formatting ##

    >>> import datetime
    >>> name = 'Fred'
    >>> age = 50
    >>> anniversary = datetime.date(1991, 10, 12)
    >>> f'My name is {name}, my age next year is {age+1}, my anniversary is {anniversary:%A, %B %d, %Y}.'
    'My name is Fred, my age next year is 51, my anniversary is Saturday, October 12, 1991.'
    >>> f'He said his name is {name!r}.'
    "He said his name is 'Fred'."


----------

&#160; &#160; &#160; &#160;终于要加了么，在其他语言上用的感觉不错，简介的。<br>&#160; &#160; &#160; &#160;嗯.....就在写这篇博文的时候突然想起来，现在你看到这个网页的生成模版就类似这样的。

&#160; &#160; &#160; &#160;但是3.x跟我无缘啊。