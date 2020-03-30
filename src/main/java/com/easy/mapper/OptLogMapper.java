package com.easy.mapper;

import com.easy.domain.OptLog;
public interface OptLogMapper {
	
	/***
	 * 保存操作日志
	 * 
	 * @param log	日志对象
	 */
	public void saveOptLog(OptLog log);
}
