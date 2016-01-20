Title: neural network
Date: 2014-06-14 19:58
Modified: 2014-06-14 19:58
Category: MachineLearning
Tags: CNN,ML
Slug: neural_network_2014_06_14_19_58
Authors: kai_kai03
Summary: 简单易懂的神经网络

## Principles of training multi-layer neural network using backpropagation

The project describes teaching process of multi-layer neural network employing _backpropagation_ algorithm. To illustrate this 
process the three layer neural network with two inputs and one output,which is shown in the picture below, is used:

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img01.gif)</center>

Each neuron is composed of two units. First unit adds products of weights coefficients and input signals. The second unit realise nonlinear
 function, called neuron activation function. Signal _e_ is adder output signal, and _y = f(e)_ is output signal of nonlinear 
element. Signal _y_ is also output signal of neuron.

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img01b.gif)</center>

To teach the neural network we need training data set. The training data set consists of input signals (_x<sub>1</sub>_ and 
_x<sub>2</sub>_ ) assigned with corresponding target (desired output) _z_. The network training is an iterative process. In each 
iteration weights coefficients of nodes are modified using new data from training data set. Modification is calculated using algorithm 
described below:
Each teaching step starts with forcing both input signals from training set. After this stage we can determine output signals values for 
each neuron in each network layer. Pictures below illustrate how signal is propagating through the network, Symbols _w<sub>(xm)n</sub>_
 represent weights of connections between network input _x<sub>m</sub>_ and neuron _n_ in input layer. Symbols _y<sub>n</sub>_
 represents output signal of neuron _n_.

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img02.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img03.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img04.gif)</center>

Propagation of signals through the hidden layer. Symbols _w<sub>mn</sub>_ represent weights of connections between output of neuron
 _m_ and input of neuron _n_ in the next layer.

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img05.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img06.gif)</center>

Propagation of signals through the output layer.

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img07.gif)</center>

In the next algorithm step the output signal of the network _y_ is compared with the desired output value (the target), which is found
 in training data set. The difference is called error signal <font face="symbol"><span style="font-family: Symbol">_d_</span></font> of
 output layer neuron. 

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img08.gif)</center>

It is impossible to compute error signal for internal neurons directly, because output values of these neurons are unknown. For many years 
the effective method for training  multiplayer networks has been unknown. Only in the middle eighties the backpropagation algorithm has been
 worked out. The idea is to propagate error signal <font face="symbol"><span style="font-family: Symbol">_d_</span></font> (computed in 
single teaching step) back to all neurons, which output signals were input for discussed neuron.

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img09.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img10.gif)</center>

The weights' coefficients _w<sub>mn</sub>_ used to propagate errors back are equal to this used during computing output value. Only the 
direction of data flow is changed (signals are propagated from output to inputs one after the other). This technique is used for all network
 layers. If propagated errors came from few neurons they are added. The illustration is below:

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img11.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img12.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img13.gif)</center>

When the error signal for each neuron is computed, the weights coefficients of each neuron input node may be modified. In formulas below 
_df(e)/de_ represents derivative of neuron activation function (which weights are modified).

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img14.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img15.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img16.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img17.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img18.gif)</center>

<center>![]({filename}/article_img/neural_network_2014_06_14_19_58/img19.gif)</center>

Coefficient <font face="symbol"><span style="font-family: Symbol">_h_</span></font> affects network teaching speed. There are a few
 techniques to select this parameter. The first method is to start teaching process with large value of the parameter. While weights 
coefficients are being established the parameter is being decreased gradually. The second, more complicated, method starts teaching with 
small parameter value. During the teaching process the parameter is being increased when the teaching is advanced and then decreased again in 
the final stage. Starting teaching process with low parameter value enables to determine weights coefficients signs.