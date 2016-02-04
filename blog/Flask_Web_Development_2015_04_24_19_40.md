Title: Flask Web Development(4)
Date: 2015-04-24 19:40
Modified: 2015-04-24 19:40
Category: pyDev
Tags: Flask,Python,Web
Slug: Flask_Web_Development_2015_04_24_19_40
Authors: tangyefei
Summary: 第4章 表单


##《Flask Web Development》--第4章 表单 ##

为了解决表单验证之类的重复和繁琐的问题，可以引入Flask-WTF来让表单使用变得简单（注：如果不使用Flask自带的模板，而是用Angular.js等前端技术本章可以略过，因为表单验证是跟Jinjia2模板紧密关联在一起的）。通过pip安装：

	(venv) $ pip install flask-wtf

### CSRF ###

CSRF是Cross-Site Request Forgery Protection的缩写，通常发生在一个站点发送请求到另一个受害者登陆的站点时。

### 如何设置保护 ###

Flask-WTF对所有表单请求提供保护，为了实现保护你需要像下面这样设置：

	app = Flask(__name__)
	app.config['SECRET_KEY'] = 'hard to guess string'

关于上述代码的几点说明： app.config常备用来存储一些配置信息，甚至还能够从文件中导入配置；SECRET_KEY是常用来做加密的变量，它会被用来生成一个token，该token用于每次登陆时候的校验。

### Form Classes ###

在Flask-WTF中每个表单是一个集成自Form的类，类里面定义了一些列的属性，每个属性又有一个或者多个的校验器。

	from flask.ext.wtf import Form
	from wtforms import StringField, SubmitField 
	from wtforms.validators import Required
	
	class NameForm(Form):
	    name = StringField('What is your name?', validators=[Required()]) 
	    submit = SubmitField('Submit')

如上，有几点要说明的:

（1）导入部分有点奇怪，可以参考原文帮助理解 “The Flask-WTF extension is a Flask integration wrapper around the framework-agnostic WTForms package” 

（2）属性部分，StringField会被转换为input[type="field",label="What is your name?"]，提交之前会执Require的validator，其他的属性类也类似对应到HTML的其他组件。

更具体的组件类和校验器的使用，请参考书籍相应部分或文档。

### HTML渲染表单 ###

将构建的NameForm对象form传递给页面以后，就可以按照下面这种方式是用Form：

	<form method="POST">
	    {{ form.name.label }} {{ form.name(id='my-text-field') }} 
	    {{ form.submit() }}
	</form>

通过添加id或者class你就可以给这些组件添加样式了，但是要完全使用
Bootstrap的样式，可以导入helper调用wtf.quick_form(form)来快速实现Form的布局：

*templates/index.html*
	
	{% extends "commonBase.html" %}
	{% import "bootstrap/wtf.html" as wtf %}
	
	{% block title %}Flasky{% endblock %}
	
	{% block page_content %}
	    <div class="page-header">
	        <h1>Hello, {% if name %}{{ name }}{% else %}Stranger{% endif %}!</h1>
	    </div>
	    {{ wtf.quick_form(form) }}
	{% endblock %}

*index.py*

	from flask.ext.wtf import Form
	from wtforms import StringField, SubmitField
	from wtforms.validators import Required
	#...
	app = Flask(__name__)
	app.config['SECRET_KEY'] = 'hard to guess string'
	#...
	class NameForm(Form):
	    name = StringField('What is your name?', validators=[Required()])
	    submit = SubmitField('Submit')
	#...
	@app.route('/')
	def index():
	    form = NameForm()
	    return render_template('index.html', form=form)

### 表单响应 ###

阅读如下这段代码，看看当第一进入页面时候；输入空值时候；输入部位空值的时候各是什么效果：

	@app.route('/', methods=['GET', 'POST'])
	def index():
	    name = None
	    form = NameForm()
	    if form.validate_on_submit():
	        name = form.name.data
	        form.name.data = ''
	    return render_template('index.html', form=form, name=name)

### 重定向和Session ###

在之前的例子中用户进入页面时候发送的是get请求，填写name提交标案以后是post请求，提交完后刷新页面，页面会提示是否离开当前页面。这是因为之前的请求是post的，刷新会导致重新发送该请求（个人电脑上实验没有发生这样的情况）。

由此引入重定向来解决这个问题，为了防止重定向以后的数据丢失，我们要讲数据存储在session中， index.py改写部分的代码如下所示：

	from flask import Flask, render_template, session, redirect, url_for
	#...
	@app.route('/', methods=['GET', 'POST'])
	def index():
	    form = NameForm()
	    if form.validate_on_submit():
	        session['name'] = form.name.data
	        return redirect(url_for('index'))
	    return render_template('index.html', form=form, name=session.get('name'))

### 消息提示 ###

对于错误、确认、警告信息，Flask提供了`flash()`方法。使用分为python中调用`flask()`和在模板中呈现message两部分；

*index.py*

	#...
	from flask import Flask, render_template, session, redirect, url_for, flash
	
	@app.route('/', methods=['GET', 'POST'])
	def index():
	    form = NameForm()
	    if form.validate_on_submit():
	        old_name = session.get('name')
	        if old_name is not None and old_name != form.name.data:
	            flash('Looks like you have changed your name!')
	        session['name'] = form.name.data
	        form.name.data = ''
	        return redirect(url_for('index'))
	    return render_template('index.html',form = form, name = session.get('name'))

仅在名字发生了更新的时候调用`flash()`。

*templates/commonBase.html*

	{% block content %}
	    <div class="container">
	        {% for message in get_flashed_messages() %} <div class="alert alert-warning">
	        <button type="button" class="close" data-dismiss="alert">×</button>
	        {{ message }}
	        </div>
	        {% endfor %}
	            {% block page_content %}{% endblock %}
	    </div>
	{% endblock %}

之所以选择在commonBase.html是因为flash messages的普遍性，`get_flashed_messages()`遍历的是一个请求处理中可能的多个flash调用，新的请求会清除之前请求flash的message。

在Flask中的表单提交的数据可以通过request.form获取到。
