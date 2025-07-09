import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Map, Source, Layer, MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import bbox from '@turf/bbox';
import * as turf from '@turf/turf';

// 定义图层样式 - 彩虹色方案 (从蓝色到红色，无边框)
const layerStyles = [
  {
    'id': 'nc-level-0',
    'type': 'fill' as const,
    'source-layer': 'nc_level0',
    'paint': {
      'fill-color': '#0000ff', // 蓝色
      'fill-opacity': 0.3
    }
  },
  {
    'id': 'nc-level-1',
    'type': 'fill' as const,
    'source-layer': 'nc_level1',
    'paint': {
      'fill-color': '#0080ff', // 青色
      'fill-opacity': 0.3
    }
  },
  {
    'id': 'nc-level-2',
    'type': 'fill' as const,
    'source-layer': 'nc_level2',
    'paint': {
      'fill-color': '#00ffff', // 青色
      'fill-opacity': 0.3
    }
  },
  {
    'id': 'nc-level-3',
    'type': 'fill' as const,
    'source-layer': 'nc_level3',
    'paint': {
      'fill-color': '#00ff00', // 绿色
      'fill-opacity': 0.3
    }
  },
  {
    'id': 'nc-level-4',
    'type': 'fill' as const,
    'source-layer': 'nc_level4',
    'paint': {
      'fill-color': '#ffff00', // 黄色
      'fill-opacity': 0.3
    }
  },
  {
    'id': 'nc-level-5',
    'type': 'fill' as const,
    'source-layer': 'nc_level5',
    'paint': {
      'fill-color': '#ff8000', // 橙色
      'fill-opacity': 0.3
    }
  },
  {
    'id': 'nc-level-6',
    'type': 'fill' as const,
    'source-layer': 'nc_level6',
    'paint': {
      'fill-color': '#ff4000', // 橙红色
      'fill-opacity': 0.3
    }
  },
  {
    'id': 'nc-level-7',
    'type': 'fill' as const,
    'source-layer': 'nc_level7',
    'paint': {
      'fill-color': '#ff0000', // 红色
      'fill-opacity': 0.3
    }
  }
];

// 定义颜色方案 - 彩虹色方案
const colorScheme = [
  '#0000ff', // nc_level0 - 蓝色
  '#0080ff', // nc_level1 - 青色
  '#00ffff', // nc_level2 - 青色
  '#00ff00', // nc_level3 - 绿色
  '#ffff00', // nc_level4 - 黄色
  '#ff8000', // nc_level5 - 橙色
  '#ff4000', // nc_level6 - 橙红色
  '#ff0000'  // nc_level7 - 红色
];

// 路网颜色方案
const roadColorScheme = [
  '#ef6362', // AUroads_all_1
  '#f7bf58', // AUroads_all_2
  '#70f928', // AUroads_all_3
  '#4cd2f5', // AUroads_all_4
  '#221bef'  // AUroads_all_5
];

// 道路颜色方案
const roadTypeColors = {
  1: '#ff0000',  // 鲜艳的红色
  2: '#ffa500',  // 鲜艳的橙色
  3: '#00ff00',  // 鲜艳的绿色
  4: '#00ffff',  // 鲜艳的青色
  5: '#0000ff'   // 鲜艳的蓝色
};

function App() {
  const [selectedArea, setSelectedArea] = useState<GeoJSON.Feature | null>(null);
  const [selectionBox, setSelectionBox] = useState<[number, number, number, number] | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [intersectedFeatures, setIntersectedFeatures] = useState<GeoJSON.Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 8 });
  const overviewMapRef = useRef<MapRef>(null);
  const detailMapRefs = useRef<(MapRef | null)[]>(Array(8).fill(null));
  const intersectionMapRef = useRef<MapRef>(null);
  const [roadFeatures, setRoadFeatures] = useState<GeoJSON.Feature[]>([]);
  const [currentZoom, setCurrentZoom] = useState(3.5);
  const [loadedRoadLevels, setLoadedRoadLevels] = useState<number[]>([]);
  const [currentBounds, setCurrentBounds] = useState<[number, number, number, number] | null>(null);
  const [filteredRoadFeatures, setFilteredRoadFeatures] = useState<GeoJSON.Feature[]>([]);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFilteredFeaturesRef = useRef<GeoJSON.Feature[]>([]);
  
  // 添加图层控制状态
  const [layerVisibility, setLayerVisibility] = useState({
    urbanization: true,  // urbanization图层默认显示
    roads: true         // 道路图层默认显示
  });

  // 添加下载功能状态
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedAreaData, setSelectedAreaData] = useState<{
    urbanization: GeoJSON.FeatureCollection | null;
    roads: GeoJSON.FeatureCollection | null;
  }>({
    urbanization: null,
    roads: null
  });

  // 添加数据加载状态管理
  const [dataLoadingStates, setDataLoadingStates] = useState({
    urbanization: false,
    roads: false
  });
  const [showLayers, setShowLayers] = useState({
    urbanization: true,
    roads: true
  });
  const [loadingTimeout, setLoadingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // 添加测试状态
  const [appLoaded, setAppLoaded] = useState(false);

  // 使用TileJSON数据源，不需要手动加载GeoJSON文件
  useEffect(() => {
    // 模拟加载完成，因为TileJSON会自动加载
    setIsLoading(false);
    setLoadingProgress({ current: 8, total: 8 });
    setAppLoaded(true);
  }, []);

  // 计算相交特征
  const calculateIntersections = (box: [number, number, number, number]) => {
    if (!overviewMapRef.current) {
      console.error('Map reference not available');
      return;
    }

    const [minLng, minLat, maxLng, maxLat] = box;
    const boxPolygon = turf.bboxPolygon([minLng, minLat, maxLng, maxLat]);
    
    console.log('Selection box:', box);
    
    // 使用MapLibre的queryRenderedFeatures来获取相交的特征
    const intersected: GeoJSON.Feature[] = [];
    
    // 查询所有nc_level图层
    for (let i = 0; i < 8; i++) {
      const layerId = `nc-level-${i}`;
      try {
        const features = overviewMapRef.current.queryRenderedFeatures(
          [[minLng, minLat], [maxLng, maxLat]],
          { layers: [layerId] }
        );
        
        features.forEach(feature => {
          try {
            if (turf.booleanIntersects(feature as GeoJSON.Feature, boxPolygon)) {
              intersected.push(feature as GeoJSON.Feature);
            }
          } catch (error) {
            console.error('Error checking intersection for feature:', error);
          }
        });
      } catch (error) {
        console.error(`Error querying layer ${layerId}:`, error);
      }
    }
    
    console.log('Intersected features:', intersected.length);
    if (intersected.length > 0) {
      console.log('First intersected feature:', intersected[0]);
    } else {
      console.warn('No features intersected with the selection box');
    }
    setIntersectedFeatures(intersected);

    // 更新右下角地图视图
    if (intersectionMapRef.current && intersected.length > 0) {
      try {
        const bounds = turf.bbox(turf.featureCollection(intersected));
        console.log('Fitting bounds for intersection map:', bounds);
        intersectionMapRef.current.fitBounds(
          [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
          { padding: 20, duration: 1000 }
        );
      } catch (error) {
        console.error('Error fitting bounds for intersection map:', error);
      }
    }
  };

  // 创建相交特征的GeoJSON数据，按层级分组
  const createLayeredFeatures = () => {
    const layers = Array(8).fill(null).map(() => ({
      type: 'FeatureCollection',
      features: [] as GeoJSON.Feature[]
    }));

    console.log('Creating layered features from:', intersectedFeatures.length, 'features');
    
    intersectedFeatures.forEach(feature => {
      // 从source-layer属性中提取层级信息
      const sourceLayer = feature.properties?.['source-layer'] || feature.properties?.layer;
      if (sourceLayer) {
        const level = parseInt(sourceLayer.split('nc_level')[1]);
        if (!isNaN(level) && level >= 0 && level < 8) {
          console.log(`Adding feature to layer ${level}`);
          layers[level].features.push(feature);
        }
      }
    });

    // 打印每个图层的特征数量
    layers.forEach((layer, index) => {
      console.log(`Layer ${index} has ${layer.features.length} features`);
    });

    return layers;
  };

  const handleMouseDown = (e: any) => {
    if (!isSelecting) return;
    const { lngLat } = e;
    setStartPoint([lngLat.lng, lngLat.lat]);
    setEndPoint([lngLat.lng, lngLat.lat]);
    setIsDragging(true);
  };

  const handleMouseMove = (e: any) => {
    if (!isSelecting || !startPoint || !isDragging) return;
    const { lngLat } = e;
    setEndPoint([lngLat.lng, lngLat.lat]);
  };

  // 更新所有小窗口的视图
  const updateDetailMaps = (bounds: [number, number, number, number]) => {
    detailMapRefs.current.forEach(mapRef => {
      if (mapRef) {
        mapRef.fitBounds(
          [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
          { padding: 20 }
        );
      }
    });
  };

  const handleMouseUp = () => {
    if (!isSelecting || !startPoint || !endPoint) return;
    setIsDragging(false);
    
    const minLng = Math.min(startPoint[0], endPoint[0]);
    const maxLng = Math.max(startPoint[0], endPoint[0]);
    const minLat = Math.min(startPoint[1], endPoint[1]);
    const maxLat = Math.max(startPoint[1], endPoint[1]);
    
    const newSelectionBox = [minLng, minLat, maxLng, maxLat] as [number, number, number, number];
    setSelectionBox(newSelectionBox);
    
    calculateIntersections(newSelectionBox);
    updateDetailMaps(newSelectionBox);
    
    // 自动裁剪选择区域的数据
    clipData(newSelectionBox);
    
    setStartPoint(null);
    setEndPoint(null);
  };

  const toggleSelectionMode = () => {
    if (isLoading) {
      console.log('Data is still loading, please wait...');
      return;
    }
    setIsSelecting(!isSelecting);
    if (!isSelecting) {
      setStartPoint(null);
      setEndPoint(null);
      setSelectionBox(null);
      setIsDragging(false);
    } else {
      // 取消选择时清除已裁剪的数据
      setSelectedAreaData({
        urbanization: null,
        roads: null
      });
    }
  };

  // 移动到香港的函数
  const flyToHongKong = () => {
    if (!overviewMapRef.current) {
      console.error('Map reference not available');
      return;
    }

    // 香港的坐标 (经度, 纬度)
    const hongKongCoordinates: [number, number] = [114.1694, 22.3193];
    
    // 使用flyTo方法进行平滑动画
    overviewMapRef.current.flyTo({
      center: hongKongCoordinates,
      zoom: 13.5,
      duration: 40000, // 40秒的动画时间（调慢一倍）
      essential: true
    });
  };

  // 移动到伦敦的函数
  const flyToLondon = () => {
    if (!overviewMapRef.current) {
      console.error('Map reference not available');
      return;
    }

    // 伦敦的坐标 (经度, 纬度)
    const londonCoordinates: [number, number] = [-0.1276, 51.5074];
    
    // 使用flyTo方法进行平滑动画
    overviewMapRef.current.flyTo({
      center: londonCoordinates,
      zoom: 13.5,
      duration: 40000, // 40秒的动画时间（调慢一倍）
      essential: true
    });
  };

  // 创建选择框的GeoJSON数据
  const selectionBoxGeoJSON = startPoint && endPoint ? {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [startPoint[0], startPoint[1]],
        [startPoint[0], endPoint[1]],
        [endPoint[0], endPoint[1]],
        [endPoint[0], startPoint[1]],
        [startPoint[0], startPoint[1]]
      ]]
    }
  } : null;

  // 更新当前视图边界（带防抖）
  const handleViewStateChange = useCallback((e: ViewStateChangeEvent) => {
    const { zoom } = e.viewState;
    setCurrentZoom(zoom);
    setIsMapMoving(true);

    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置新的定时器
    debounceTimerRef.current = setTimeout(() => {
      setIsMapMoving(false);
    }, 150); // 150毫秒的防抖延迟
  }, []);

  // 计算比例尺
  const getScale = (zoom: number) => {
    const scale = Math.round(156543.03392 * Math.cos(0) / Math.pow(2, zoom));
    if (scale >= 1000) {
      return `${Math.round(scale / 1000)} km`;
    } else {
      return `${scale} m`;
    }
  };

  // 图层切换函数
  const toggleLayer = (layerName: 'urbanization' | 'roads') => {
    setLayerVisibility(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  // 裁剪数据函数
  const clipData = async (bounds: [number, number, number, number]) => {
    if (!overviewMapRef.current) return;

    const [minLng, minLat, maxLng, maxLat] = bounds;
    const boxPolygon = turf.bboxPolygon([minLng, minLat, maxLng, maxLat]);
    
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // 裁剪urbanization数据
      const urbanizationFeatures: GeoJSON.Feature[] = [];
      if (layerVisibility.urbanization) {
        for (let i = 0; i < 8; i++) {
          const layerId = `nc-level-${i}`;
          try {
            const features = overviewMapRef.current.queryRenderedFeatures(
              [[minLng, minLat], [maxLng, maxLat]],
              { layers: [layerId] }
            );
            
            features.forEach(feature => {
              try {
                if (turf.booleanIntersects(feature as GeoJSON.Feature, boxPolygon)) {
                  urbanizationFeatures.push(feature as GeoJSON.Feature);
                }
              } catch (error) {
                console.error('Error checking intersection for urbanization feature:', error);
              }
            });
          } catch (error) {
            console.error(`Error querying urbanization layer ${layerId}:`, error);
          }
        }
        setDownloadProgress(50);
      }

      // 裁剪道路数据
      const roadFeatures: GeoJSON.Feature[] = [];
      if (layerVisibility.roads) {
        try {
          const features = overviewMapRef.current.queryRenderedFeatures(
            [[minLng, minLat], [maxLng, maxLat]],
            { layers: ['roads-layer'] }
          );
          
          features.forEach(feature => {
            try {
              if (turf.booleanIntersects(feature as GeoJSON.Feature, boxPolygon)) {
                roadFeatures.push(feature as GeoJSON.Feature);
              }
            } catch (error) {
              console.error('Error checking intersection for road feature:', error);
            }
          });
        } catch (error) {
          console.error('Error querying roads layer:', error);
        }
        setDownloadProgress(100);
      }

      // 保存裁剪后的数据
      setSelectedAreaData({
        urbanization: urbanizationFeatures.length > 0 ? {
          type: 'FeatureCollection',
          features: urbanizationFeatures
        } : null,
        roads: roadFeatures.length > 0 ? {
          type: 'FeatureCollection',
          features: roadFeatures
        } : null
      });

      console.log(`裁剪完成: urbanization ${urbanizationFeatures.length} 个特征, roads ${roadFeatures.length} 个特征`);
      
    } catch (error) {
      console.error('裁剪数据时出错:', error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // 下载数据函数
  const downloadData = () => {
    if (!selectedAreaData.urbanization && !selectedAreaData.roads) {
      alert('没有可下载的数据，请先选择区域');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // 下载urbanization数据
    if (selectedAreaData.urbanization) {
      const urbanizationBlob = new Blob([JSON.stringify(selectedAreaData.urbanization, null, 2)], {
        type: 'application/json'
      });
      const urbanizationUrl = URL.createObjectURL(urbanizationBlob);
      const urbanizationLink = document.createElement('a');
      urbanizationLink.href = urbanizationUrl;
      urbanizationLink.download = `urbanization_data_${timestamp}.json`;
      document.body.appendChild(urbanizationLink);
      urbanizationLink.click();
      document.body.removeChild(urbanizationLink);
      URL.revokeObjectURL(urbanizationUrl);
    }

    // 下载道路数据
    if (selectedAreaData.roads) {
      const roadsBlob = new Blob([JSON.stringify(selectedAreaData.roads, null, 2)], {
        type: 'application/json'
      });
      const roadsUrl = URL.createObjectURL(roadsBlob);
      const roadsLink = document.createElement('a');
      roadsLink.href = roadsUrl;
      roadsLink.download = `roads_data_${timestamp}.json`;
      document.body.appendChild(roadsLink);
      roadsLink.click();
      document.body.removeChild(roadsLink);
      URL.revokeObjectURL(roadsUrl);
    }

    alert('数据下载完成！');
  };

  // 修改过滤道路数据的useEffect
  useEffect(() => {
    if (currentBounds && roadFeatures.length > 0 && !isMapMoving) {
      setIsUpdating(true);
      const filtered = roadFeatures.filter(feature => {
        try {
          return turf.booleanIntersects(feature, turf.bboxPolygon(currentBounds));
        } catch (error) {
          console.error('Error filtering road feature:', error);
          return false;
        }
      });
      setFilteredRoadFeatures(filtered);
      lastFilteredFeaturesRef.current = filtered;
      setIsUpdating(false);
    }
  }, [currentBounds, roadFeatures, isMapMoving]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 调试信息显示 */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '12px',
        zIndex: 9999,
        fontFamily: 'monospace'
      }}>
        <div>应用状态: {appLoaded ? '已加载' : '加载中'}</div>
        <div>加载状态: {isLoading ? '加载中' : '已完成'}</div>
        <div>地图移动: {isMapMoving ? '是' : '否'}</div>
        <div>图层显示: {showLayers.urbanization ? '是' : '否'}</div>
      </div>
      
      {/* 测试显示 - 确保应用正常加载 */}
      {!appLoaded && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 9999,
          textAlign: 'center'
        }}>
          <div>应用加载中...</div>
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            如果长时间显示此消息，请检查控制台错误
          </div>
        </div>
      )}
      
      {/* 3D地球视图 */}
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {/* 统一控制面板 */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '12px',
          borderRadius: '10px',
          minWidth: '220px',
          fontFamily: 'Arial, sans-serif',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          
          {/* 选择功能区域 */}
          <div style={{
            marginBottom: '12px',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '6px',
              color: '#4CAF50'
            }}>
              区域选择
            </div>
            <button 
              onClick={toggleSelectionMode}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: isLoading ? '#666' : (isSelecting ? '#4CAF50' : '#f44336'),
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
              disabled={isLoading}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? '数据加载中...' : (isSelecting ? '✓ 取消选择' : '📍 开始选择')}
            </button>
          </div>
          
          {/* 图层控制区域 */}
          <div style={{
            marginBottom: '12px',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#2196F3'
            }}>
              图层控制
            </div>
            
            {/* Urbanization图层控制 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              padding: '5px 6px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '4px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '11px',
                flex: 1
              }}>
                <input
                  type="checkbox"
                  checked={layerVisibility.urbanization}
                  onChange={() => toggleLayer('urbanization')}
                  style={{
                    marginRight: '8px',
                    transform: 'scale(1.2)',
                    accentColor: '#4CAF50'
                  }}
                />
                <span style={{ 
                  color: layerVisibility.urbanization ? '#4CAF50' : '#ccc',
                  fontWeight: layerVisibility.urbanization ? 'bold' : 'normal'
                }}>
                  自然城市
                </span>
              </label>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: layerVisibility.urbanization ? '#4CAF50' : '#666',
                borderRadius: '2px',
                marginLeft: '6px',
                boxShadow: layerVisibility.urbanization ? '0 0 4px rgba(76, 175, 80, 0.5)' : 'none'
              }} />
            </div>
            
            {/* 道路图层控制 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 6px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '4px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '11px',
                flex: 1
              }}>
                <input
                  type="checkbox"
                  checked={layerVisibility.roads}
                  onChange={() => toggleLayer('roads')}
                  style={{
                    marginRight: '8px',
                    transform: 'scale(1.2)',
                    accentColor: '#2196F3'
                  }}
                />
                <span style={{ 
                  color: layerVisibility.roads ? '#2196F3' : '#ccc',
                  fontWeight: layerVisibility.roads ? 'bold' : 'normal'
                }}>
                  自然道路
                </span>
              </label>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: layerVisibility.roads ? '#2196F3' : '#666',
                borderRadius: '2px',
                marginLeft: '6px',
                boxShadow: layerVisibility.roads ? '0 0 4px rgba(33, 150, 243, 0.5)' : 'none'
              }} />
            </div>
          </div>
          
          {/* 数据下载区域 */}
          <div style={{
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#FF9800'
            }}>
              数据下载（正在测试）
            </div>
            
            {/* 下载按钮 */}
            <button
              onClick={downloadData}
              disabled={isDownloading || (!selectedAreaData.urbanization && !selectedAreaData.roads)}
              style={{
                width: '100%',
                padding: '8px 10px',
                backgroundColor: isDownloading || (!selectedAreaData.urbanization && !selectedAreaData.roads) 
                  ? '#666' 
                  : '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isDownloading || (!selectedAreaData.urbanization && !selectedAreaData.roads) 
                  ? 'not-allowed' 
                  : 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                marginBottom: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isDownloading && (selectedAreaData.urbanization || selectedAreaData.roads)) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDownloading && (selectedAreaData.urbanization || selectedAreaData.roads)) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isDownloading ? '⏳ 处理中...' : '📥 下载选中区域数据'}
            </button>
            
            {/* 下载进度条 */}
            {isDownloading && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{
                  fontSize: '10px',
                  marginBottom: '4px',
                  color: '#ccc',
                  textAlign: 'center'
                }}>
                  裁剪进度: {downloadProgress}%
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${downloadProgress}%`,
                    height: '100%',
                    backgroundColor: '#4CAF50',
                    transition: 'width 0.3s ease-in-out',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            )}
            
            {/* 数据状态显示 */}
            <div style={{ 
              fontSize: '10px', 
              color: '#ccc',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '3px'
            }}>
              <div style={{
                padding: '3px 4px',
                backgroundColor: selectedAreaData.urbanization ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '3px',
                textAlign: 'center',
                border: selectedAreaData.urbanization ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                自然城市: {selectedAreaData.urbanization ? '✓' : '✗'}
              </div>
              <div style={{
                padding: '3px 4px',
                backgroundColor: selectedAreaData.roads ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '3px',
                textAlign: 'center',
                border: selectedAreaData.roads ? '1px solid rgba(33, 150, 243, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                自然道路: {selectedAreaData.roads ? '✓' : '✗'}
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={flyToLondon}
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '20px',
            zIndex: 1,
            padding: '8px 16px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          移动到伦敦
        </button>
        <button 
          onClick={flyToHongKong}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 1,
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          移动到香港
        </button>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '20px',
            borderRadius: '8px',
            zIndex: 2,
            textAlign: 'center'
          }}>
            <div>数据加载中，请稍候...</div>
            <div style={{ marginTop: '10px' }}>
              进度: {loadingProgress.current}/{loadingProgress.total}
            </div>
            <div style={{ 
              width: '200px', 
              height: '10px', 
              backgroundColor: '#eee', 
              borderRadius: '5px',
              marginTop: '10px'
            }}>
              <div style={{
                width: `${(loadingProgress.current / loadingProgress.total) * 100}%`,
                height: '100%',
                backgroundColor: '#4CAF50',
                borderRadius: '5px',
                transition: 'width 0.3s ease-in-out'
              }} />
            </div>
          </div>
        )}
        <Map
          ref={overviewMapRef}
          initialViewState={{
            longitude: 133.7751,
            latitude: -25.2744,
            zoom: 3.5,
            pitch: 60,
            bearing: 0
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMove={handleViewStateChange}
          dragPan={!isSelecting}
          dragRotate={!isSelecting}
          scrollZoom={!isSelecting}
          doubleClickZoom={!isSelecting}
          reuseMaps
        >
          {/* 添加地球投影图层 */}
          <Layer
            id="globe"
            type="background"
            paint={{
              'background-color': 'transparent'
            }}
          />
          {/* 使用TileJSON加载urbanization数据 */}
          {layerVisibility.urbanization && (
            <Source
              id="urbanization-source"
              type="vector"
              url="https://livablecitylab.hkust-gz.edu.cn/data/globalNS.json"
            >
              {/* 添加图层 */}
              {layerStyles.map((style) => (
                <Layer
                  key={style.id}
                  id={style.id}
                  type={style.type}
                  source-layer={style['source-layer']}
                  paint={style.paint}
                />
              ))}
            </Source>
          )}
          
          {/* 使用TileJSON加载道路数据 */}
          {layerVisibility.roads && (
            <Source
              id="roads-source"
              type="vector"
              url="https://livablecitylab.hkust-gz.edu.cn/data/global_transportation.json"
            >
              <Layer
                id="roads-layer"
                type="line"
                source-layer="transportation"
                minzoom={3}
                maxzoom={14}
                paint={{
                  'line-color': [
                    'case',
                    ['==', ['get', 'level'], 4], '#ff0000',   // 红色 - level 4
                    ['==', ['get', 'level'], 5], '#ff0000',   // 橙红色 - level 5
                    ['==', ['get', 'level'], 6], '#ff8000',   // 橙色 - level 6
                    ['==', ['get', 'level'], 7], '#ffbf00',   // 橙黄色 - level 7
                    ['==', ['get', 'level'], 8], '#ffff00',   // 黄色 - level 8
                    ['==', ['get', 'level'], 9], '#80ff00',   // 浅绿色 - level 9
                    ['==', ['get', 'level'], 10], '#00ff00',  // 绿色 - level 10
                    ['==', ['get', 'level'], 11], '#00ff80',  // 青绿色 - level 11
                    ['==', ['get', 'level'], 12], '#00ffff',  // 天蓝色 - level 12
                    ['==', ['get', 'level'], 13], '#00ffff',  // 天蓝色 - level 13
                    ['==', ['get', 'level'], 14], '#0000ff',  // 深蓝色 - level 14
                    '#0000ff'  // 默认蓝色 - 其他level值
                  ],
                  'line-width': [
                    'case',
                    ['==', ['get', 'level'], 4], 3,   // level 4 最粗
                    ['==', ['get', 'level'], 5], 2.8,
                    ['==', ['get', 'level'], 6], 2.6,
                    ['==', ['get', 'level'], 7], 2.4,
                    ['==', ['get', 'level'], 8], 2.2,
                    ['==', ['get', 'level'], 9], 2,
                    ['==', ['get', 'level'], 10], 1.8,
                    ['==', ['get', 'level'], 11], 1.6,
                    ['==', ['get', 'level'], 12], 1.4,
                    ['==', ['get', 'level'], 13], 1.2,   // level 13 最细
                    ['==', ['get', 'level'], 14], 1,
                    1   // 默认宽度
                  ],
                  'line-opacity': 1.0
                }}
              />
            </Source>
          )}
          
          {/* 修改加载状态指示器 */}
          {(isMapMoving || isUpdating) && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 1
            }}>
              {isMapMoving ? '移动中...' : '更新中...'}
            </div>
          )}

          {/* 比例尺和Zoom Level显示 */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1,
            fontFamily: 'monospace'
          }}>
            <div>比例尺: 1:{getScale(currentZoom)}</div>
            <div>Zoom: {currentZoom.toFixed(1)}</div>
          </div>
          
          {/* 添加选择框图层 */}
          {selectionBoxGeoJSON && (
            <Source
              id="selection-box"
              type="geojson"
              data={selectionBoxGeoJSON}
            >
              <Layer
                id="selection-box-layer"
                type="fill"
                paint={{
                  'fill-color': '#ffffff',
                  'fill-opacity': 0.2,
                  'fill-outline-color': '#ffffff'
                }}
              />
            </Source>
          )}
        </Map>
      </div>
    </div>
  );
}

export default App; 