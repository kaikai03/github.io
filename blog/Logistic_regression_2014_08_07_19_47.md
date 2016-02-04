Title: 逻辑回归
Date: 2014-08-07 19:47
Modified: 2014-08-07 19:47
Category: MachineLearning
Tags: classification,algorithm
Slug: Logistic_regression_2014_08_07_19_47
Authors: kai_kai03
Summary: 读书笔记--一句话说完：逻辑回归其实就是归一化的线性回归！！！！！

## Logistic regression  ##

设样本 $ \{x,y\} $，$ y=0 $ 或 $ y=1 $，表正类或负类。 $ x $是$ m $维样本特征向量。那么，$ x $属于正类，也就是$ y=1 $的“概率”表示为：

$$ P(y=1\mid x;\theta)=\sigma(\theta^Tx)=\frac{1}{1+\exp(-\theta^Tx)} $$

$ \theta $是模型参数（或叫回归系数），$ \sigma $是sigmoid函数。

实际上，是由 $ x $属于正类的可能性和负类的可能性的比值的对数变换得到的：

$$ \begin{aligned}\log it(x)&=\ln(\frac{P(y=1\mid x)}{P(y=0\mid x)}) \\\ &=\ln(\frac{P(y=1\mid x)}{1-P(y=1\mid x)}) \\\ &=\theta_0+\theta_1 x_1+\theta_2 x_2+\cdot \cdot \cdot +\theta_m x_m \end{aligned} $$

$ \theta_m $为权重（或叫回归系数），$ x_m $为因数。

它跟线性回归最大的区别在于将线性回归中很大的数压缩到[0,1]之间，这样值输出表达为“可能性”增加说服力（？？？？），同时弱化冒尖变量的影响
