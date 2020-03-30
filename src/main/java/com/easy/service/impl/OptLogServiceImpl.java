package com.easy.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.easy.domain.OptLog;
import com.easy.mapper.OptLogMapper;
import com.easy.service.OptLogService;
@Service
@Transactional
public class OptLogServiceImpl implements OptLogService{
	
	/***
	 * 保存操作日志
	 * 
	 * @param log	日志对象
	 */
	@Override
	public void saveOptLog(OptLog log) {
			optLogMapper.saveOptLog(log);
	}
	
	@Autowired
	private OptLogMapper optLogMapper;
}
