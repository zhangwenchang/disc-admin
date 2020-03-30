<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<c:set var="ctx" value="${pageContext.request.contextPath}" />
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>订单明细页面</title>
<link rel="stylesheet" type="text/css" href="${ctx}/static/easyui/themes/default/easyui.css"></link>
<link rel="stylesheet" type="text/css" href="${ctx}/static/easyui/themes/icon.css"></link>
<script type="text/javascript" src="${ctx}/static/easyui/jquery.easyui.min.js"></script>
<script type="text/javascript"	src="${ctx}/static/common/common.js"></script>
<script type="text/javascript">
$(function(){
	var options = {
			url: '${ctx}/order/ajax/detailList',
			pagination: true,
			pageNumber: 1,
			pageSize: 50,
			pageList: [50,100,150],
			rownumbers: true,
			queryParams : {
				batchNo: '${batchNo}'
			},
			columns : [[
						{field:'batchOrderNo',title:'批次订单号',width:120},
						{field:'orderNo',title:'上游订单号',width:120},
						{field : 'custName',title : '客户姓名',width:80},
						{field:'accountType',title:'账户类型',width:80,
							//账户类型(0:存折,1:借记卡,2:贷记卡)
							formatter:function(val){
								if(val == 1){
									return "借记卡";
								}else if(val == 0){
									return "存折";
								}else if(val == 2){
									return "贷记卡";
								}
								return val;
						}},	
						{field : 'accountNo',title : '银行账户号',width:150},
						{field : 'issueBankNo',title : '开户网点号',width:100},
						{field : 'amount',title : '支付金额(元)',width:100,
							formatter:function(val){
								return ''+ Number(val).format('#,###.00') + '';		
						}},
						{field : 'orderStatus',title : '支付状态',width:100,
							formatter:function(val){
								if("01" == val){
									return "支付成功";
								}else if("02" == val){
									return "支付失败";
								}else if("03" == val){
									return "处理中";
								}
						}},
						{field : 'respCode',title : '接口状态码',width:100},
						{field : 'respMsg',title : '接口返回状态信息',width:120}
				 ]]
		};
	 //初始化组件
	 $('#tt').datagrid(options);
	//查询
	 $('#browseBtn').click(function(){
		  var batchResultFilePath = $("#downLoadFileName").val();
		  window.open("${ctx}/public/browseFileOnline?isTask=0&batchResultPath=" + batchResultFilePath,"browseBatchResultFile",'width=610,height=430,location=no,titletar=no,scrollbars=yes');
	  });
});
</script>
</head>
<body>
   <div class="block">
		<div class="block-heading">
			<a>批次信息</a>
		</div>
		<div id="condition" class="block-body collapse in">
			<div class="container-fluid form-horizontal" style="margin: 20px;">
			 <div class="row-fluid">
				<div class="span5">
					<div class="control-group">
						<label class="control-label">批次编号:</label>
						<div class="controls">
								<input type="text" id="batchNo" class="input-medium" value="${order.batchNo }" readonly="readonly"/> 
						</div>
					</div>
					<div class="control-group">
						<label class="control-label">支付订单笔数:</label>
						<div class="controls">
								<input type="text" id="payNum" class="input-medium" value="${order.totalNum }"  readonly="readonly"/>
								<input type="hidden" id="downLoadFileName" class="input-medium" value="${order.downloadFileName }"/> 
						</div>
					</div>
					<div class="control-group">
						<label class="control-label">记录创建时间:</label>
						<div class="controls">
								<input type="text" id="createDate" class="input-medium" value='<fmt:formatDate value="${order.createTime }" pattern="yyyy/MM/dd HH:mm:ss"/>'   readonly="readonly"/>
						</div>
					</div>
				</div>
				<div class="span5">
					<div class="control-group">
						<label class="control-label">批量文件名:</label>
						<div class="controls">
								<input type="text" id="fileName" class="input-medium" value="${order.uploadFileName }" readonly="readonly"/> 
						</div>
					</div>
					<div class="control-group">
						<label class="control-label">支付订单金额(元):</label>
						<div class="controls">
								<input type="text" id="payAmnt" class="input-medium" value="${order.totalAmntStr }"  readonly="readonly"/> 
						</div>
					</div>
					<div class="control-group">
						<label class="control-label">执行状态:</label>
						<div class="controls">
								<input type="text" id="status" name="status" class="input-medium" value="${order.statusMsg }" readonly="readonly"/> 
						</div>
					</div>
					<form id="form1" action="${ctx}/batchTask/backList" method="post">
					<div class="control-group">
						<label class="control-label">&nbsp;</label>
						<div class="controls">
							<c:if test="${!empty order.downloadFileName}">
								<button type="button" id="browseBtn" name="browseBtn" class="btn btn-primary">打开结果文件</button>
							</c:if>
							<button type="submit" id="backBtn" name="backBtn" class="btn btn-primary">返回</button>
							<input type="hidden" id="taskPageNumber" name="page" value="${taskPageNumber}"/>
							<input type="hidden" id="taskPageSize" name="rows" value="${taskPageSize}"/>
							<input type="hidden" id="startDate" name="startDate" value="${startDate}"/>
							<input type="hidden" id="status" name="status" value="${status}"/>
							<input type="hidden" id="callNo" name="callNo" value="${callNo}"/>
							<input type="hidden" id="endDate" name="endDate" value="${endDate}"/>
							<input type="hidden" id="sysType" name="sysType" value="${sysType}"/>
						</div>
					</div>
					</form>
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