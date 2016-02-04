Title: Flask Web Development(3)
Date: 2015-04-24 17:01
Modified: 2015-04-24 17:01
Category: pyDev
Tags: Flask,Python,Web
Slug: Flask_Web_Development_2015_04_24_17_01
Authors: tangyefei
Summary: 第3章 模板

## 《Flask Web Development》--第3章 模板 

View Function有两个任务：（1）处理业务逻辑 （2）返回响应内容。将两者分开管理能够使代码更好容易维护，模板起的就是这么一个作用。本章介绍的模板引擎Jinjia2。

### Jinjia模板引擎 ###

模板只是一些包含文本的字符串，设置的变量标记位最终会被模板引擎用数据替换。要使用Jinjia模板，第一步是定义模板，Jinjia2默然会到templates子目录中寻找模板，所以在该目录下定义两个模板文件：

*templates/index.html:*
	
	<h1>Hello World!</h1>
	
*templates/user.html：*
	
	<h1>Hello {{name}}!</h1>

### 渲染模板 ###

如下例子导入渲染模板的方法，然后调用模板方法去注入模板：

*index.py*

	from flask import Flask, render_template
	
	@app.route('/index') 
	def index():
	return render_template('index.html')
	
	@app.route('/<name>')
	def user(name):
	    return render_template('user.html', name=name)

启动server以后可以分别访问相对路径`/index`和`/<name>`索引来查看页面内容结果。

### 变量类型 ###

模板中除了接受普通变量，还能接收复杂的数据结构，比如dict、list、obj，修改后的模板如下：

*templates/user.html:*

	<p>A value from a dictionary: {{ mydict['key'] }}.</p>
	<p>A value from a list: {{ mylist[3] }}.</p>
	<p>A value from a list, with a variable index: {{ mylist[myintvar] }}.</p>
	<p>A value from an object's method: {{ myobj.somemethod() }}.</p>

那么对应的在python就要定义一些数据结构：

*index.py*

	class Human():
	    def somemethod(self):
	        return 'what the fucking world!'

	@app.route('/<name>')
	def user(name):
	    mydict = {"key": "To Be or Not To Be"}
	    mylist = ['it', 'is', 'a', 'problem']
	    myintvar = 0
	    myobj = Human()
	
	    return render_template('user.html', name=name, mydict=mydict, mylist=mylist, myintvar=myintvar, myobj=myobj)

可以执行index.py来查看运行结果。

除了使用复杂的数据结构以外，模板中还能使用[过滤器](http://jinja.pocoo.org/docs/dev/templates/#builtin-filters)对内容进行过滤，下面是一个将字符内容变为大写的例子：

	Hello, {{ name|capitalize }}

### 控制结构 ###

Jinjia2能够使用常见的控制流，如下是常用的集中控制流的简要介绍：

* If控制流

*index.py*

	@app.route('/flow')
	def flow():
	    user = 'tangyefei'
	
	    return render_template('flow.html', user=user)

*templates/flow.html*

	{% if user %}
	    Hello, {{user}}
	{% else %}
	    Hello, stranger
	{% endif %}
	
* Loop控制流

*index.py*

	@app.route('/loop')
	def loop():
	    comments = ["To Be", "Or", "Not To Be"]
	
	    return render_template('loop.html', comments=comments)

*templates/loop.html*

	<ul>
	    {% for comment in comments%}
	        <li>{{comment}}</li>
	    {% endfor %}
	</ul>

* Macro

*index.py*

	@app.route('/macro')
	def macro():
	    comments = ["To Be", "Or", "Not To Be"]
	
	    return render_template('macro.html', comments=comments)

*templates/macro.html*

	{% macro render_comment(comment) %}
	    <li>{{comment}}</li>
	{% endmacro %}
	
	<ul>
	     {% for comment in comments%}
	        {{ macro.render_comment(comment) }}
	    {% endfor %}
	</ul>

* 外部导入Macro

*index.py*

	@app.route('/comments')
	def comments():
	    comments = ["To Be", "Or", "Not To Be"]
	
	    return render_template('comments.html', comments=comments)

*templates/macro.html*

	{% macro render_comment(comment) %}
	    <li>{{comment}}</li>
	{% endmacro %}
	
	templates/comments.html
	
	{% import 'macro.html' as macro %}
	<ul>
	     {% for comment in comments%}
	        {{ macro.render_comment(comment) }}
	    {% endfor %}
	</ul>

* 模板继承

*index.py*

	@app.route('/extends')
	def extends():
	    return render_template('child.html')
	
	/templates/base.html
	
	<!DOCTYPE html>
	<html lang="en">
	<head>
	    <meta charset="UTF-8">
	    {% block head%}
	        <title>
	            {% block title%}{% endblock%}- My Application
	        </title>
	    {% endblock %}
	</head>
	<body>
	    {% block body%}
	    {% endblock%}
	</body>
	</html>

*/templates/child.html*

	{% extends 'base.html'%}
	
	{% block title%}
	    Index
	{% endblock %}
	
	{% block head%}
	    {{ super() }}
	    <style>
	    </style>
	{% endblock%}
	
	{% block body%}
	    <h1>Helll, World!</h1>
	{% endblock%}

### 集成Bootstrap ###

要使用Bootstrap，最直观的办法是引入对应的css和js文件，在Flask中只需要安装Flask-Bootstrap，然后在模板中继承*base.html*就可以使用Bootstrap。如下为安装和使用的一个详细的例子：

第一步，安装flask-bootstrap

	(venv) $ pip install flask-bootstrap

第二步，Python文件中使用Bootstrap

	# 引入flask-bootstrap
	from flask.ext.bootstrap import Bootstrap
	
	# 包裹app
	bootstrap = Bootstrap(app)
	
	# 定义View Function
	@app.route('/bootstrap/<name>')
	def bootstrap(name):
	    return render_template('bootstrap.html', name=name)

第三步，构建模板覆写提供的三个block

	{% extends 'bootstrap/base.html'%}
	
	{% block title%} Flasky {% endblock %}
	{% block navbar%}
	
	    <div class="navbar navbar-inverse" role="navigation">
	        <div class="container">
	            <div class="navbar-header">
	            <button type="button" class="navbar-toggle"
	            data-toggle="collapse" data-target=".navbar-collapse">
	                <span class="sr-only">Toggle navigation</span>
	                <span class="icon-bar"></span>
	                <span class="icon-bar"></span>
	                <span class="icon-bar"></span>
	           </button>
	            <a class="navbar-brand" href="/">Flasky</a> </div>
	            <div class="navbar-collapse collapse">
	                <ul class="nav navbar-nav">
	                    <li><a href="/">Home</a></li>
	                </ul>
	            </div>
	        </div>
	    </div>
	{% endblock %}
	{% block content%}
	    <div class="container">
	        <div class="page-header">
	        <h1>Hello, {{ name }}!</h1> </div>
	    </div>
	{% endblock %}

Bootstrap还定义了一些其他的Block能够被覆写的，比如下面的例子是一个覆写block script的例子：

	{% block scripts %}
	    {{ super() }}
	    <script type="text/javascript" src="my-script.js"></script>
	{% endblock %}

### 定制错误页面 ###

Flask允许我们基于template来定制错误页面：

	@app.errorhandler(404)
	def page_not_found(e):
	    return render_template('404.html'), 404
	
	@app.errorhandler(500)
	def internal_server_error(e):
	    return render_template('500.html'), 500

因为我们引入了Bootstrap，为了保证界面一致性你可能会想直接拷贝Bootstrap的base.html页面来修改一个 404.html。但是更简单的做法是，基于Bootstrap的base.html定制一个tempates/base.html，将一些项目通用的内容放在里面，然后项目页面比如 404.html基础都以此为基础：

*templates/base.html*

	{% extends "bootstrap/base.html" %}
	
	{% block title %}Flasky{% endblock %}
	{% block navbar %}
	<div class="navbar navbar-inverse" role="navigation">
	    <div class="container">
	        <div class="navbar-header">
	            <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
	                <span class="sr-only">Toggle navigation</span>
	                <span class="icon-bar"></span>
	                <span class="icon-bar"></span>
	                <span class="icon-bar"></span>
	            </button>
	            <a class="navbar-brand" href="/">Flasky</a>
	        </div>
	        <div class="navbar-collapse collapse">
	            <ul class="nav navbar-nav">
	                <li><a href="/">Home</a></li>
	            </ul>
	        </div>
	    </div>
	</div>
	{% endblock %}
	
	{% block content %}
	    <div class="container">
	        {% block page_content %}{% endblock %}
	    </div>
	{% endblock %}
	
*templates/404.html*
	
	{% extends 'commonBase.html'%}
	
	{% block title%} Page Not Found{% endblock%}
	{% block content %}
	    <div class="page-header">
	        <h1>Not Found</h1>
	    </div>
	{% endblock%}

可以尝试访问一个不存在的地址，看页面是否定位到了我们定制的404页面。
请求跳转

在代码中我们可能会想获取某个路由，因为很多路由都有参数，一旦路由参数发生变化，直接获取路由的代码就需要更新来保证仍能正常工作。

为此Flask提供了一个工具方法 `url_for` 用来做获取View Function所对应的路由，注意该方法只是用来获取url而不是做跳转的方法:

	url_for('user', name='john', _external=True)

该方法会将多余参数凭借到url后面：

	# would return /?page=2.
	url_for('index', page=2)

### 静态文件 ###

在Flask中，静态文件会从根目录中的static下去寻找。如下是一个使用图片作为浏览器Tab的Icon的例子，图片可以在Flasky项目中找：

*templates/base.html* 添加代码片段

	{% block head %}
	    {{ super() }}
	    <link rel="shortcut icon" href="{{ url_for('static', filename = 'favicon.ico') }}" type="image/x-icon">
	    <link rel="icon" href="{{ url_for('static', filename = 'favicon.ico') }}" type="image/x-icon">
	{% endblock %}

本地化时间和日期

用户遍及在世界各地，因此统一用UTC来表示时间日期。但是在每个客户端，用户所看到的时间格式应该有所不同。这个工作最适合交给客户端-浏览器来做，因为浏览器能获取到用户的地区和语言设置。

有这么一个客户端的js库叫moment.js实现了很多时间日期处理相关的方法，在Flask中可以通过安装flask-moment来使用它。如下是使用的例子：

第一步，安装

	(venv)$ pip install flask-moment

第二步，在Python中导入

*index.py*

	# 导入moment和local的datetime
	from flask.ext.moment import Moment
	from datetime import datetime
	#...
	moment = Moment(app)
	#...
	@app.route('/')
	def index():
	    return render_template('index.html', current_time=datetime.utcnow())

第三步，在页面中引入和使用

*templates/base.html*

	{% block scripts %}
	{{ super() }}
	{{ moment.include_moment() }}
	{% endblock %}

*templates/index.html*

	<p>The local date and time is {{ moment(current_time).format('LLL') }}.</p>
	<p>That was {{ moment(current_time).fromNow(refresh=True) }}</p>

[moment.js](http://momentjs.com/docs/#/displaying/)实现了format()、fromNow()、 fromTime()等方法，使用这些方法基本能够构建出友好的客户端代码了。
