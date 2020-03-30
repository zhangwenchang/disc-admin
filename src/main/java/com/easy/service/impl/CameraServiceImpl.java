package com.easy.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.commons.page.Page;
import com.easy.domain.Camera;
import com.easy.mapper.CameraMapper;
import com.easy.service.CameraService;
@Service
public class CameraServiceImpl implements CameraService{
	private static final Logger loger = LoggerFactory.getLogger(CameraServiceImpl.class);
	@Autowired
	private CameraMapper cameraMapper;
	
	@Override
	public void getByPage(Page<Camera> p) {
		// TODO Auto-generated method stub
		
	}

}
