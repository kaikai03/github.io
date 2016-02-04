Title: flask_socketio
Date: 2015-12-31 17:05
Modified: 2015-12-31 17:05
Category: pyDev
Tags: Flask-SocketIO,Flask,JavaScript,WebSocket,Web,Python
Slug: flask_socketio_2015_12_31_17_05
Authors: kai_kai03
Summary: WebSocket简单应用

## 牢骚 ##
因为在线舞台产品--咪啪中有一个弹幕的需求，平台开发的同事那边实在搞不定rtmp的信息流。为了效果演示，我先将就用html5的canvas来做一个临时的。

这里面需要用到web通信，突然就想到年初做webRtc demo用的WebSocket了。

之前WebSocket的后台用Node.js来做，而现在咪啪这个产品正式后台是java的、临时测试及调试后台是python的，于是去搜了搜，Flask加上Flask-SocketIO后可以支持WebSocket。前端用socket.io，可以简化开发。

## 正文 ##

Flask-SocketIO用起来真是超方便。

	@socketio.on('event') #指定监听的时间
	def foo(data): #data是前端发来的一个json
	    pass

例如：

前端发来一个加入房间的事件消息

	socket.emit('join', {id:userId});

平台这边通过设定时间监听，执行对应函数

	@socketio.on('join')
	def on_join(data):
		# 加入到socketio提供的一个“用户列队”中
	    join_room(data['room']) 
		# 返回消息，告知用户“你加入xxxx号房间成功”
	    emit('you have joined room', {'data': data['room']})
		# 广播一条消息，告知所有房间内的用户“谁谁谁来了”
	    emit('broadcast',str(data['id']) + ' has entered the room.', room = data['room'], broadcast = True)

弹幕消息广播呢，我这么写，其实就比上面多一个`include_self`,看过弹幕站的都知道，自己肯定可以看到自己的发言啦

	@socketio.on('say')
	def on_say(data):
	    emit('broadcast', data['content'], room = data['room'], broadcast = True, include_self = True)


最后用户掉线的时候别忘了用户退出或者掉线的时候，让用户“退出房间”

	@socketio.on('disconnect')
	@socketio.on('leave')
	def on_leave(data):
	    leave_room(data['room'])


## flask-socketio 开发手册 ##
[地址](http://flask-socketio.readthedocs.org/en/latest/)