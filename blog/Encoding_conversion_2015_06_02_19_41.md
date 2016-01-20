Title: 汉字转换问题
Date: 2015-06-02 19:41
Modified: 2015-06-02 19:41
Category: pyDev
Tags: encode,unicode,GBK,Python
Slug:  Encoding_conversion_2015_06_02_19_41
Authors: kai_kai03
Summary: 今天看到一个不错的转换方法

&#160; &#160; &#160; &#160;先判断类型<br>
&#160; &#160; &#160; &#160;如果是string，就按latin-1转为bytes，decode utf-8<br>
&#160; &#160; &#160; &#160;如果本身就是bytes，直接decode就行了

    >>>s='\xe7\xa9\xbf\xe5\xb1\xb1\xe7\x94\xb2\xe5\x88\xb0\xe5\xba\x95\xe8\xaf\xb4\xe4\xba\x86\xe4\xbb\x80\xe4\xb9\x88\xef\xbc\x9f'
    >>> s.encode('latin-1').decode('utf-8')
    '穿山甲到底说了什么？'
    >>>
    >>>s=b'\xe7\xa9\xbf\xe5\xb1\xb1\xe7\x94\xb2\xe5\x88\xb0\xe5\xba\x95\xe8\xaf\xb4\xe4\xba\x86\xe4\xbb\x80\xe4\xb9\x88\xef\xbc\x9f'
    >>> s.decode('utf-8')
    '穿山甲到底说了什么？'

第一个s是string，第二个s是bytes


错误的例子：    

    >>>s='\xe7\xa9\xbf\xe5\xb1\xb1\xe7\x94\xb2\xe5\x88\xb0\xe5\xba\x95\xe8\xaf\xb4\xe4\xba\x86\xe4\xbb\x80\xe4\xb9\x88\xef\xbc\x9f'
    >>>s.encode('utf-8').decode('utf-8')
    'ç©¿å±±ç\x94²å\x88°åº\x95è¯´äº\x86ä»\x80ä¹\x88ï¼\x9f'

用 utf-8 或者 ascii 来 encode 都是不对的