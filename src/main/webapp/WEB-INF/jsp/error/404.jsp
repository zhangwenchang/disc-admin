<%@ page contentType="text/html;charset=UTF-8" language="java"
	isErrorPage="true"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<c:set var="ctx" value="${pageContext.request.contextPath}" />
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>404</title>
<link rel="stylesheet" type="text/css"	href="${ctx}/static/bootstrap/css/bootstrap.css" />
<link rel="stylesheet" type="text/css"	href="${ctx}/static/bootstrap-portnine/css/theme.css" />
<link rel="stylesheet"	href="${ctx}/static/font-awesome/css/font-awesome.css" />
<script src="${ctx}/static/jquery/jquery-1.9.1.min.js"	type="text/javascript"></script>
<script src="${ctx}/static/bootstrap/js/bootstrap.js"	type="text/javascript"></script>
</head>
<!--[if lt IE 7 ]> <body class="ie ie6"> <![endif]-->
<!--[if IE 7 ]> <body class="ie ie7 "> <![endif]-->
<!--[if IE 8 ]> <body class="ie ie8 "> <![endif]-->
<!--[if IE 9 ]> <body class="ie ie9 "> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!-->
<body>
	<!--<![endif]-->

	<div class="navbar navbar-fixed-top">
		<div class="navbar-inner">
			<ul class="nav pull-right">
			</ul>
			<a class="brand" href="index.html"></a>
		</div>
	</div>

	<div class="modal" style="margin-top: 10%;">
		<div class="modal-header">
			<h3>提示信息</h3>
		</div>
		<div class="modal-body center">
			<h5>您访问的页面不存在!</h5>
		</div>
	</div>

</body>
</html>