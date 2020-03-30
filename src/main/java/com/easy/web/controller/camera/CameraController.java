package com.easy.web.controller.camera;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.easy.domain.Camera;
import com.easy.service.CameraService;
@Controller
@RequestMapping(value = "/camera")
public class CameraController {
	
	@Autowired
	private CameraService cameraService;
	
	@RequestMapping
	public String index() {
		return "camera/list";
	}
	
	@RequestMapping(value = "list")
	@ResponseBody
	public Map<String, Object> list() {
		List<Camera> list = new ArrayList<Camera>();
		Camera c1 = new Camera();
		c1.setIp("192.168.1.2");
		c1.setPort("3306");
		c1.setUserName("test1");
		list.add(c1);
		Camera c2 = new Camera();
		c2.setIp("192.168.1.2");
		c2.setPort("3306");
		c2.setUserName("test1");
		list.add(c2);
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("total", list.size());
		map.put("rows", list);
		
		return map;
	}
}
