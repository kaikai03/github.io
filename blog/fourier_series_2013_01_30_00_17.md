Title: 傅立叶级数
Date: 2013-01-30 00:17
Modified: 2013-01-30 00:17
Category: MachineLearning
Tags: DataProcessing,Math
Slug:  fourier_series_2013_01_30_00_17
Authors: kai_kai03
Summary: 高数课本再阅读

## fourier series ##

周期为T的函数x(t)标识为无穷级数：

$$ x(t)=\sum_{k=-\infty}^{+\infty}a_k*e^{jk(\frac{2\pi}{T})t} $$
j为虚数

其中$ a_k $可按下式计算：
$$ a_k=\frac{1}{T}\int_T x(t)*e^{-jk(\frac{2\pi}{T})t} dt $$

注意到：$ f_k(t)=e^{jk(\frac{2\pi}{T})t} $ 是周期为T的函数，故k取不同值时的周期信号具有谐波关系（既具有同一个周期T）。<br>
k=0时，第一个式子中对应的这一项称为直流分量。<br>
k=1时，具有基波频率$ \omega_0=\frac{2\pi}{T} $ ，称为一次谐波或基波。<br>
类似的有二次谐波，三次谐波
