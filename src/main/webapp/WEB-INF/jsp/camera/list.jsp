<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<c:set var="ctx" value="${pageContext.request.contextPath}" />
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>摄像机列表</title>
<link rel="stylesheet" type="text/css" href="${ctx}/static/easyui/themes/default/easyui.css"></link>
<link rel="stylesheet" type="text/css" href="${ctx}/static/easyui/themes/icon.css"></link>
<link rel="stylesheet" type="text/css" href="${ctx}/static/bootstrap-datetimepicker/css/datetimepicker.css" />
<script type="text/javascript" src="${ctx}/static/easyui/jquery.easyui.min.js"></script>
<script type="text/javascript" src="${ctx}/static/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js"></script>
<script type="text/javascript" src="${ctx}/static/bootstrap-datetimepicker/js/locales/bootstrap-datetimepicker.zh-CN.js"></script>
<script type="text/javascript">
$(function(){
	var options = {
			url: '${ctx}/camera/list',
			pagination: false,
			singleSelect: true,
			rownumbers: true,
			queryParams : {
			},
			columns : [[
						{field:'ip',title:'地址',width:150},
						{field:'port',title:'端口',width:100},
						{field:'userName',title:'用户',width:80}
				 ]]
		};
	 //初始化组件
	 $('#tt').datagrid(options);
	//查询
	  $('#searchBtn').click(function(){
		  $('#tt').datagrid('load');
	  });
	
});
</script>
</head>
<body>
   <div class="block">
		<div class="block-heading">
			<a>检索条件</a>
		</div>
		<div id="condition" class="block-body collapse in">
			<div class="container-fluid form-horizontal" style="margin: 20px;">
			 <div class="row-fluid">
				<div class="span5">
					<div class="control-group">
						<label class="control-label">上游系统标志:</label>
						<div class="controls">
						    <input type="text" id="sysType"  name="sysType"  class="input-medium" value="${sysType}"/> 
						</div>
					</div>
				</div>
				<div class="span5">
					<div class="control-group">
						<label class="control-label">上游调用批次号:</label>
						<div class="controls">
						    <input type="text" id="callNO"  name="callNO"  class="input-medium" value="${callNO}"/> 
						</div>
					</div>
				 </div>
			  </div>
			</div>
			<div class="container-fluid form-horizontal" style="margin-left:40px;">
				<div class="control-group">
					<label class="control-label">&nbsp;</label>
					<div class="controls">
						<button id="searchBtn" class="btn btn-primary">查询</button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="block">
		<div class="block-heading">
			<a>
				<span>查询结果</span>
			</a>
		</div>
		<div id="result" class="block-body collapse in">
			<table id="tt" style="height:350px"></table>
		</div>
	</div>
</body>
</html>