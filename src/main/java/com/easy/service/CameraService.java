package com.easy.service;

import com.commons.page.Page;
import com.easy.domain.Camera;

public interface CameraService {
	
	public void getByPage(Page<Camera> p);
}
