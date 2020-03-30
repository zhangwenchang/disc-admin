<%@ page contentType="text/html;charset=UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="sitemesh" uri="http://www.opensymphony.com/sitemesh/decorator"%>
<c:set var="ctx" value="${pageContext.request.contextPath}" />
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>刻录管理系统 - <sitemesh:title /></title>
<meta http-equiv="Cache-Control" content="no-store" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
<link rel="stylesheet" type="text/css"
	href="${ctx}/static/bootstrap/css/bootstrap.min.css" />
<link rel="stylesheet"
	href="${ctx}/static/font-awesome/css/font-awesome.min.css" />
<%-- <link rel="stylesheet" type="text/css"
	href="${ctx}/static/bootstrap-portnine/css/theme.css" /> --%>
<link rel="stylesheet" type="text/css"
	href="${ctx}/static/layui/css/layui.css" />
<script src="${ctx}/static/jquery/jquery-1.9.1.min.js"
	type="text/javascript"></script>
<script type="text/javascript"
	src="${ctx}/static/bootstrap/js/bootstrap-dialog.js"></script>
<script type="text/javascript"
	src="${ctx}/static/bootstrap/js/bootstrap-validation.js"></script>
<sitemesh:head />
</head>

<body class="layui-layout-body">
<div class="layui-layout layui-layout-admin">
  <div class="layui-header">
    <div class="layui-logo">刻录管理系统</div>
    
    <ul class="layui-nav layui-layout-right">
      <li class="layui-nav-item">
        <a href="javascript:;">
          <img src="http://t.cn/RCzsdCq" class="layui-nav-img">
          贤心
        </a>
        <dl class="layui-nav-child">
          <dd><a href="">基本资料</a></dd>
          <dd><a href="">安全设置</a></dd>
        </dl>
      </li>
      <li class="layui-nav-item"><a href="">退了</a></li>
    </ul>
  </div>
  
  <div class="layui-side layui-bg-black">
    <div class="layui-side-scroll">
      <!-- 左侧导航区域（可配合layui已有的垂直导航） -->
      <ul class="layui-nav layui-nav-tree"  lay-filter="test">
        <li class="layui-nav-item layui-nav-itemed">
          <a class="" href="javascript:;">刻录</a>
          <dl class="layui-nav-child">
            <dd><a href="javascript:;">刻录向导</a></dd>
            <dd><a href="javascript:;">刻录历史</a></dd>
          </dl>
        </li>
        <li class="layui-nav-item">
          <a href="javascript:;">项目</a>
          <dl class="layui-nav-child">
          	<dd><a href="${ctx}/camera">项目管理</a></dd>
            <dd><a href="${ctx}/camera">光盘管理</a></dd>
          </dl>
        </li>
        <li class="layui-nav-item">
          <a href="javascript:;">设备管理</a>
          <dl class="layui-nav-child">
          	<dd><a href="${ctx}/camera">刻录终端管理</a></dd>
            <dd><a href="${ctx}/camera">监控设备管理</a></dd>
          </dl>
        </li>
        <li class="layui-nav-item">
          <a href="javascript:;">用户管理</a>
          <dl class="layui-nav-child">
          	<dd><a href="${ctx}/camera">用户管理</a></dd>
          	<dd><a href="${ctx}/camera">权限管理</a></dd>
          </dl>
        </li>
        <li class="layui-nav-item">
          <a href="javascript:;">系统设置</a>
          <dl class="layui-nav-child">
          	<dd><a href="${ctx}/camera">系统设置</a></dd>
          </dl>
        </li>
      </ul>
    </div>
  </div>
  
  <div class="layui-body">
    <div style="padding: 15px;">
    	<sitemesh:body />
    </div>
  </div>
  
</div>
<script src="${ctx}/static/bootstrap/js/bootstrap.min.js"	type="text/javascript"></script>
<script src="${ctx}/static/layui/layui.js" type="text/javascript"></script>
<script>
//JavaScript代码区域
layui.use('element', function(){
  var element = layui.element;
});
</script>
</body>
</html>


