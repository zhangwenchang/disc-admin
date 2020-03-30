package com.easy.service;

import com.easy.domain.OptLog;
public interface OptLogService {
	
	/***
	 * 保存操作日志
	 * 
	 * @param log	日志对象
	 */
	public void saveOptLog(OptLog log);
}
