package com.easy.common;

import java.util.HashMap;
import java.util.Map;

import com.commons.page.Page;

/**
 * 分页导出
 * 
 * @date 2014-2-21
 * @author yanxu
 * @action 创建
 * 
 */
public class PageHelper {

	private PageHelper() {
	}

	public static Map<String, Object> export(Page<?> page) {
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("total", page.getTotalCount());
		map.put("rows", page.getResults());
		return map;
	}

}
