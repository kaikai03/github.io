Title: Flask Web Development(2)
Date: 2015-04-22 14:56
Modified: 2015-04-22 14:56
Category: pyDev
Tags: Flask,Python,Web
Slug: Flask_Web_Development_2015_04_22_14_56
Authors: tangyefei
Summary: 第2章 基础应用的结构

##《Flask Web Development》--第2章 基础应用的结构


本章将开始熟悉一个最基本的Flask应用的不同部分，并自己动手构建一个Flask Web应用。

### 初始化 ###

所有Flask的应用程序必须构建一个Flask的对象，然后通过协议将从客户端收到的所有请求交给这个实例进行处理：

    from flask import Flask
    Flask app = Flask(__name__)

关于Flask中参数的说明：Flask的构造函数只接收一个参数，这里是\_\_name\_\_会指向该程序片段所在的模块。目前只需要知道使用\_\_name\_\_就够了。

### 路由和函数 ###

Web客户端请求的链接地址不同，后台会通过route来决定每个链接对应的哪块处理代码。最简单的做法就是使用Flask实例中提供的方法app.route来注册一个方法到路由上：

	@app.route('/') 
	def index():
	return '<h1>Hello World!</h1>'



Flask路由上是可以配置动态参数的：

	@app.route('/user/<name>') 
    def user(name):
    return '<h1>Hello, %s!<\h1>' % name


在上例中，尖括号中间的内容是动态的，任何匹配了该形式的URL会映射到这个路由上，然后调用对应的View Function。默认的，传递的参数被当做string处理，当然你也可以执行它们 比如`@app.route /user/<int:id>`

### Server启动 ###

应用程序实例有一个run方法用于启动Flask所集成的Web服务器：

	if __name__ == '__main__': 
    	app.run(debug=True)

if判定条件是为了保证：只有该script被直接执行的时候才去启动server，因为如果该script是被当做模块引入的，那么很可能在其他的script中已经启动过server了。

启动过后server会一直轮巡检查是否收到有客户端的请求，Mac OS下可以通过ctrl+c 停止server。run方法有很多可选参数可以配置，比如设置`debug=True`能够进入调试模式方便查看调试信息。 

### 一个完整的应用 ###

在前面的代码片段已经说明了该例子的各个部分，可以尝试在自己的编辑器上构建这么一个hello.py:

    from flask import Flask
    
    app = Flask(__name__)
    
    @app.route('/')
    def index():
    	return '<h1>Hello World!</h1>'
    
    if __name__ == '__main__':
    	app.run(debug=True)

确保保证你是在虚拟环境下运行*hello.py*，最后访问 [http://127.0.0.1:5000/](http://127.0.0.1:5000/) 即可看到Hello World页面。

### 请求的生命周期 ###
###### 应用与请求上下文 ######

每个来自客户端的请求处理过程都需要构建一些对象，比如request对象。

 为了将处理请求需要的参数传递给View Function，我们可以给View Function的链接中增加动态参数，但是那样参数一多久会显得混乱了。Flask采用了Context中保存对象的做法，request对象会从context中获取属于当前请求的参数，以方便全局访问一些对象，如下就是一个例子：

    from flask import request 
    
    @app.route('/')
    def index():
    	user_agent = request.headers.get('User-Agent') 
    	return '<p>Your browser is %s</p>' % user_agent

当然不同的请求访问到的是不同的request对象，因为Flask中采用了一定的机制保证获取对象的正确获取，逻辑不复杂有兴趣可以细看相应章节。

在Flask中使用了一个map结构来保存Route和View Function的对应关系，如下示例代码可以查看该map的存储键值对：

    (venv) $ python
    >>> from hello import app
    >>> app.url_map
    Map([<Rule '/' (HEAD, OPTIONS, GET) -> index>,
    	<Rule '/static/<filename>' (HEAD, OPTIONS, GET) -> static>,
    	<Rule '/user/<name>' (HEAD, OPTIONS, GET) -> user>])

###### 钩子函数

于面向切面编程概念中，我们通常希望请求前、后可能希望做一些通用的处理，在Flask中可以使用一些钩子函数来达到这个目的，Flask提供了四个钩子函数：

*   before_first_request
*   before_request
*   after_request
*   teardown_request

钩子函数的一个典型的应用场景是：在第一次请求中通过`before_first_reques`t来获取到用户数据存储到Context中，以后请求就可以直接从Context中直接取用户数据了。

###### 响应结果

返回给前台的数据可以是一个字符串，还可以携带第二个甚至第三个参数：

    @app.route('/') 
    def index():
    	return '<h1>Bad Request</h1>', 400

更好的做法是返回一个response对象：

	from flask import make_response
	
	@app.route('/') 
	def index():
		response = make_response('<h1>This document carries a cookie!</h1>') 
		response.set_cookie('answer', '42')
		return response

还有其他一种方式是直接定位到另一个地址：

	from flask import redirect

	@app.route('/') 
	def index():
    	return redirect('http://www.example.com')

有一中特殊的用法，就是abort，用来再页面处理错误直接返回404：

	from flask import abort
	
	@app.route('/user/<id>') 
	def get_user(id):
	    user = load_user(id) if not user:
	        abort(404)
	    return '<h1>Hello, %s</h1>' % user.name

### Flask的扩展
###### 带命令行选项的Flask-Script

Flask有大量的用于不同目的的扩展可以使用，如果这些还不满足要求你还可以开发自己的扩展。该部分会介绍如何集成一个用于加强命令行的功能的扩展，使命令行能携带参数。

第一步，使用pip安装该扩展：

    (venv) $ pip install flask-script


第二步，基于hello.py修改代码：

	from flask import Flask
	rom flask.ext.script import Manager
	
	app = Flask(__name__)
	manager = Manager(app)
	
	@app.route('/')
	def index():
		return '<h1>Hello World!</h1>'

    if __name__ == '__main__':
        manager.run()

第三步，命令行执行：

    (venv) $ python hello.py
	usage: hello.py [-?] {shell,runserver} ...

	positional arguments:
	  {shell,runserver}
	    shell            Runs a Python shell inside Flask application context.
	    runserver        Runs the Flask development server i.e. app.run()
	
	optional arguments:
	      -?, --help         show this help message and exit

如上，必选参数为runserver/shell, 这里我们要做的是run server。要查看runserver有哪些参数，可以如下方式查看：

    (venv) $ python hello.py runserver --help
	usage: hello.py runserver [-h] [-t HOST] [-p PORT] [--threaded]
	                          [--processes PROCESSES] [--passthrough-errors] [-d]
	                          [-r]
	Runs the Flask development server i.e. app.run()
	
	optional arguments:
	    -h, --help
	    -t HOST, --host HOST
	    -p PORT, --port PORT
	    --threaded
	    --processes PROCESSES
	    --passthrough-errors
	    -d, --no-debug
	    -r, --no-reload

现在能够基于命令行直接设置server的host和port等参数了，可以将主机地址设置为0.0.0.0看看：

    (venv) $ python hello.py runserver --host 0.0.0.0
	* Running on http://0.0.0.0:5000/
	* Restarting with reloader