package com.easy.domain;

import java.util.Date;

public class OptLog {
	private Long seqNo;
	private String intUserId;
	private String userName;
	private String optDesc;
	private String logType;
	private String optStatus;
	private String loginIp;
	private Date createTime;
	public Long getSeqNo() {
		return seqNo;
	}
	public void setSeqNo(Long seqNo) {
		this.seqNo = seqNo;
	}
	
	public String getIntUserId() {
		return intUserId;
	}
	public void setIntUserId(String intUserId) {
		this.intUserId = intUserId;
	}
	public String getUserName() {
		return userName;
	}
	public void setUserName(String userName) {
		this.userName = userName;
	}
	public String getOptDesc() {
		return optDesc;
	}
	public void setOptDesc(String optDesc) {
		this.optDesc = optDesc;
	}
	public String getLogType() {
		return logType;
	}
	public void setLogType(String logType) {
		this.logType = logType;
	}
	public String getOptStatus() {
		return optStatus;
	}
	public void setOptStatus(String optStatus) {
		this.optStatus = optStatus;
	}
	public String getLoginIp() {
		return loginIp;
	}
	public void setLoginIp(String loginIp) {
		this.loginIp = loginIp;
	}
	public Date getCreateTime() {
		return createTime;
	}
	public void setCreateTime(Date createTime) {
		this.createTime = createTime;
	}
	public OptLog(){}
}
