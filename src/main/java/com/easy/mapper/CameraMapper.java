package com.easy.mapper;

import com.commons.page.Page;
import com.easy.domain.Camera;
public interface CameraMapper {
	public void findByPage(Page<Camera> p);
} 
