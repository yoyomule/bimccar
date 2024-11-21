import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class WebXRAR {
    constructor() {
        // 基础场景设置
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x808080);

        // 相机设置
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        // 渲染器设置
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true; // 启用 XR
        document.body.appendChild(this.renderer.domElement);

        // 控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // 模型相关
        this.cube = null;      // 存储立方体引用
        this.gccModel = null;  // 存储 GCC 模型引用

        // 添加基础场景元素
        this.addBasicElements();
        this.addLights();

        // 设置模型加载按钮
        this.setupModelButton();

        // AR 相关
        this.initAR();
        this.setupARElements();

        // 模型加载
        this.loadModel();

        // 事件监听
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // 开始渲染循环
        this.animate();
    }

    addBasicElements() {
        // 测试立方体
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        // 网格辅助线
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);

        // 坐标轴辅助线
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
    }

    addLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
    }

    async initAR() {
        if ('xr' in navigator) {
            try {
                const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                const startButton = document.getElementById('startAR');
                const infoDiv = document.getElementById('info');

                if (isSupported) {
                    startButton.disabled = false;
                    infoDiv.textContent = '设备支持 AR，点击按钮开始';
                    this.setupARButton();
                } else {
                    infoDiv.textContent = '设备不支持 AR，使用普通 3D 模式';
                }
            } catch (error) {
                console.error('AR 检查失败:', error);
                document.getElementById('info').textContent = 'AR 检查失败: ' + error.message;
            }
        } else {
            document.getElementById('info').textContent = '浏览器不支持 WebXR，使用普通 3D 模式';
        }
    }

    setupARElements() {
        // 创建 AR 瞄准环
        this.reticle = new THREE.Mesh(
            new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial()
        );
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);

        // AR 控制器
        this.controller = this.renderer.xr.getController(0);
        this.controller.addEventListener('select', () => this.onSelect());
        this.scene.add(this.controller);

        // AR 会话变量
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
    }

    setupARButton() {
        const button = document.getElementById('startAR');
        button.addEventListener('click', async () => {
            try {
                const session = await navigator.xr.requestSession('immersive-ar', {
                    requiredFeatures: ['hit-test'],
                    optionalFeatures: ['dom-overlay'],
                    domOverlay: { root: document.getElementById('info') }
                });

                this.renderer.xr.setSession(session);
                button.style.display = 'none';
                document.getElementById('info').textContent = '点击屏幕放置模型';

                session.addEventListener('end', () => {
                    button.style.display = 'block';
                    document.getElementById('info').textContent = 'AR 会话已结束';
                });
            } catch (error) {
                console.error('AR 启动失败:', error);
                document.getElementById('info').textContent = 'AR 启动失败: ' + error.message;
            }
        });
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load(
            '/data/gcc.glb',
            (gltf) => {
                this.model = gltf.scene;
                this.model.scale.set(0.1, 0.1, 0.1);
                this.scene.add(this.model);
                console.log('模型加载成功');
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% 已加载');
            },
            (error) => {
                console.error('模型加载失败:', error);
            }
        );
    }

    onSelect() {
        if (this.reticle.visible) {
            if (this.model) {
                const modelClone = this.model.clone();
                const position = new THREE.Vector3();
                const rotation = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                this.reticle.matrix.decompose(position, rotation, scale);
                
                modelClone.position.copy(position);
                modelClone.quaternion.copy(rotation);
                this.scene.add(modelClone);
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // 只有在立方体存在时才旋转
        if (this.cube) {
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    setupModelButton() {
        const button = document.getElementById('loadModel');
        button.addEventListener('click', () => {
            // 移除绿色立方体
            if (this.cube) {
                this.scene.remove(this.cube);
                this.cube = null;
            }

            // 加载 GCC 模型
            const loader = new GLTFLoader();
            loader.load(
                '/data/gcc.glb',
                (gltf) => {
                    this.gccModel = gltf.scene;
                    
                    // 调整模型
                    this.gccModel.scale.set(0.1, 0.1, 0.1); // 调整模型大小

                    // 计算模型包围盒并居中
                    const box = new THREE.Box3().setFromObject(this.gccModel);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    // 将模型移到中心
                    this.gccModel.position.set(-center.x, -center.y, -center.z);

                    // 添加模型到场景
                    this.scene.add(this.gccModel);

                    // 调整相机位置以适应模型
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const fov = this.camera.fov * (Math.PI / 180);
                    let cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 2;

                    this.camera.position.set(cameraZ, cameraZ, cameraZ);
                    this.controls.target.set(0, 0, 0);
                    this.camera.lookAt(0, 0, 0);
                    this.controls.update();

                    console.log('GCC模型加载成功');
                },
                (xhr) => {
                    console.log((xhr.loaded / xhr.total * 100) + '% 已加载');
                },
                (error) => {
                    console.error('GCC模型加载失败:', error);
                }
            );
        });
    }
}