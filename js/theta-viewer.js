(function($) {
  'use strict';

  var experiment = {
    'events': []
  };

  function EventLog() {
    this.title = '';
    this.start = '';
    this.end = '';
  }

  EventLog.prototype.startEventLog = function() {
    this.start = (new Date(event.timeStamp)).toString();
  }

  EventLog.prototype.finishEventLog = function(type) {
    this.title = type;
    this.end = (new Date(event.timeStamp)).toString();

    experiment.events.push(this);

    localStorage.setItem('experiment', JSON.stringify(experiment));
  }

  var switchLog = new EventLog();
  var dragLog   = new EventLog();

  //elementはHTML内のDOM要素を指す
  //(ここではdiv#theta-viewer)プラグインからthatで渡されている点に注意.
  //ThetaViewer内のthatはThetaViewerオブジェクト自身のこと

  /* MainThetaViewerクラス（コンストラクタ） */
  var MainThetaViewer = function(element, texture, mode) {

    // シーンの生成
    function buildScene(that) {
      that.scene = new THREE.Scene();
    }

    // レンダラーの生成と要素の追加
    //このthatはThetaViewerオブジェクトを指している
    function createRenderer(that, element, mode) {
      if (mode === "WebGL") {
        that.renderer = new THREE.WebGLRenderer({
          antialias: true
        });
        that.renderer.setClearColor(0x000000, 1);
      } else if (mode === "CSS3D") {
        that.renderer = new THREE.CSS3DRenderer();
      } else if (mode === "Canvas") {
        that.renderer = new THREE.CanvasRenderer();
        that.renderer.setClearColor(0x000000, 1);
      }

      that.renderer.setSize(element.width(), element.height());

      // elementにWebGLを表示するcanvas要素を追加
      $(element).append(that.renderer.domElement);
    }

    // カメラの生成とシーンへの追加
    function createCamera(that) {
      var fov = 72, // 視野角
        aspect = element.width() / element.height(), // アスペクト比
        near = 0.1, // 奥行きの表示範囲の最小値
        far = 1000; // 奥行きの表示範囲の最大値

      that.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

      // カメラの注視点
      that.camera.lookAt({
        x: 1,
        y: 0,
        z: 0
      });

      that.camera.direction = {
        x: 1,
        y: 0,
        z: 0
      };

      that.scene.add(that.camera);
    }

    // 形状(球体)の生成
    function buildSphere(that, texture) {
      var radius = 1, // 半径
        widthSegments = 32, // 横方向分割数
        heightSegments = 16, // 縦方向分割数
        phiStart = 0, // φ方向の開始角度
        phiLength = 2 * Math.PI, // φ方向の覆っている角度
        thetaStart, // θ方向の開始角度
        thetaLength, // θ方向の覆っている角度
        matrix; // 球体の内側と外側を反転させる行列

      // 画像の縦横比からθ方向の覆っている範囲を計算
      thetaLength = 2 * Math.PI *
        texture.image.height / texture.image.width;
      if (thetaLength > Math.PI) {
        thetaLength = Math.PI;
      }
      thetaStart = (Math.PI - thetaLength) / 2;

      // 球体を生成
      that.geometry = new THREE.SphereGeometry(
        radius,
        widthSegments,
        heightSegments,
        phiStart,
        phiLength,
        thetaStart,
        thetaLength
      );

      // 球体の内側と外側を反転
      matrix = new THREE.Matrix4().makeScale(1, 1, -1);
      that.geometry.applyMatrix(matrix);
    }

    // 材質の生成
    function buildMaterial(that, texture) {
      that.material = new THREE.MeshBasicMaterial({
        overdraw: true,
        map: texture,
        side: THREE.FrontSide // 外側にのみテクスチャーを貼る
      });
    }

    // 形状+材質(物体)の生成とシーンへの追加
    function createMesh(that) {
      that.mesh = new THREE.Mesh(that.geometry, that.material);
      that.scene.add(that.mesh);
    }

    // イベントリスナーの追加
    function addEventListeners(that, element) {
      var isRotating = false, // 回転している最中か否か
        onMouseDownLat = 0, // マウス押し下げ位置の緯度
        onMouseDownLng = 0, // マウス押し下げ位置の経度
        onMouseDownX = 0, // マウス押し下げ位置のx座標
        onMouseDownY = 0, // マウス押し下げ位置のy座標
        // lat = 0, // 現在のカメラの緯度
        // lng = 0, // 現在のカメラの経度
        onTouchX = 0, // タッチした位置のx座標
        onTouchY = 0, // タッチした位置のy座標
        camera = that.camera,
        renderer = that.renderer,
        X,
        Y,
        Z;

      camera.lat = 0;
      camera.lng = 0;

      // 要素のサイズの変更時の処理
      function onResize() {
        camera.aspect = element.width() / element.height();
        camera.updateProjectionMatrix();
        renderer.setSize(element.width(), element.height());
      }

      // マウス押し下げ時の処理
      function onMouseDown(event) {
        event.preventDefault();
        isRotating = true;

        // マウス押し下げ位置の緯度経度と座標を記録
        onMouseDownLat = camera.lat;
        onMouseDownLng = camera.lng;
        onMouseDownX = event.clientX;
        onMouseDownY = event.clientY;
      }

      // マウス移動時の処理
      function onMouseMove(event) {
        var phi, theta;

        event.preventDefault();

        if (isRotating === true) {
          // 緯度経度を求める
          camera.lat = (event.clientY - onMouseDownY) * 0.1 +
            onMouseDownLat;
          camera.lat = Math.max(-85, Math.min(85, camera.lat));
          camera.lng = (onMouseDownX - event.clientX) * 0.1 +
            onMouseDownLng;

          // 緯度経度からθφを導出
          phi = (90 - camera.lat) * Math.PI / 180;
          theta = camera.lng * Math.PI / 180;

          X = Math.sin(phi) * Math.cos(theta);
          Y = Math.cos(phi);
          Z = Math.sin(phi) * Math.sin(theta);

          camera.lookAt({
            x: X,
            y: Y,
            z: Z
          });

          if (cloneViewer.camera) {
            cloneViewer.camera.lookAt({
              x: X,
              y: Y,
              z: Z
            });
          }

          //camera情報引き渡しのため保存
          camera.direction = {
            x: X,
            y: Y,
            z: Z
          };

          if (cloneViewer.camera) {
            cloneViewer.camera.lat = camera.lat;
            cloneViewer.camera.lng = camera.lng;
          }



        }
      }

      // マウス押し上げ時の処理
      function onMouseUp() {
        isRotating = false;
      }

      // // タッチ時の処理
      // function onTouchStart(event) {
      //     var touch;
      //     event.preventDefault();
      //     touch = event.touches[0];

      //     onTouchX = touch.screenX;
      //     onTouchY = touch.screenY;
      // }


      // // タッチしたまま移動した時の処理
      // function onTouchMove(event) {
      //     var touch, phi, theta;
      //     event.preventDefault();
      //     touch = event.touches[0];

      //     lat += (touch.screenY - onTouchY) * 0.2;
      //     lng -= (touch.screenX - onTouchX) * 0.2;

      //     onTouchX = touch.screenX;
      //     onTouchY = touch.screenY;

      //     // 緯度経度からθφを導出
      //     phi = (90 - lat) * Math.PI / 180;
      //     theta = lng * Math.PI / 180;

      //     camera.lookAt({
      //         x: Math.sin(phi) * Math.cos(theta),
      //         y: Math.cos(phi),
      //         z: Math.sin(phi) * Math.sin(theta)
      //     });
      // }

      // マウスホイール回転時の処理
      function onMouseWheel(event) {
        var fov = camera.fov, // 視野角
          fovMin = 20,
          fovMax = 100;

        event.preventDefault();

        // fovの計算
        // WebKit
        if (event.wheelDeltaY) {
          fov -= event.wheelDeltaY * 0.05;
          // Opera / Internet Explorer
        } else if (event.wheelDelta) {
          fov -= event.wheelDelta * 0.05;
          // Firefox
        } else if (event.detail) {
          fov += event.detail;
        }

        if (fov < fovMin) {
          fov = fovMin;
        }
        if (fov > fovMax) {
          fov = fovMax;
        }

        // fovの適用
        camera.fov = fov;
        camera.updateProjectionMatrix();

        if (cloneViewer.camera) {
          cloneViewer.camera.fov = fov;
          cloneViewer.camera.updateProjectionMatrix();
        }

      }

      function onContextMenu(event) {
        console.log('context: main');

        if (switchLog.start === '') {
          switchLog.startEventLog();
        }
      }

      // イベントハンドラの設定
      $(element)
        .on("mousedown", onMouseDown)
        .on("mousemove", onMouseMove)
        .on("mouseup", onMouseUp)
        .on("mouseout", onMouseUp)
        .on("resize", onResize)
        .on("contextmenu", onContextMenu);

      // // タッチが有効なとき
      // if (Modernizr.touch === true) {
      //     $(element).get(0)
      //         .addEventListener('touchstart', onTouchStart, false);
      //     $(element).get(0)
      //         .addEventListener('touchmove', onTouchMove, false);
      // }

      $(element).get(0).addEventListener('mousewheel', onMouseWheel, false);
      $(element).get(0).addEventListener('DOMMouseScroll', onMouseWheel, false);
    }

    // メイン・プログラム
    //ここのthisはMainThetaViewerオブジェクトを指している
    createRenderer(this, element, mode);
    buildScene(this);
    createCamera(this);
    if (mode === "WebGL" || mode === "Canvas") {
      buildSphere(this, texture);
      buildMaterial(this, texture);
      createMesh(this);
    } else if (mode === "CSS3D") {
      createCube(this, texture);
    }
    addEventListeners(this, element);

    this.render = (function(that) {
      return function() {
        requestAnimationFrame(that.render);
        that.renderer.render(that.scene, that.camera);
      };
    }(this));

  }; //MainThetaViewerクラスはここまで

  var CloneThetaViewer = function(element, texture, mode) {

    // シーンの生成
    function buildScene(that) {
      that.scene = new THREE.Scene();
    }

    // レンダラーの生成と要素の追加
    function createRenderer(that, element, mode) {
      if (mode === "WebGL") {
        that.renderer = new THREE.WebGLRenderer({
          antialias: true
        });
        that.renderer.setClearColor(0x000000, 1);
      } else if (mode === "CSS3D") {
        that.renderer = new THREE.CSS3DRenderer();
      } else if (mode === "Canvas") {
        that.renderer = new THREE.CanvasRenderer();
        that.renderer.setClearColor(0x000000, 1);
      }

      that.renderer.setSize(element.width(), element.height());

      // elementにWebGLを表示するcanvas要素を追加
      $(element).append(that.renderer.domElement);
    }

    // カメラの生成とシーンへの追加
    function createCamera(that) {
      var fov = 72, // 視野角
        aspect = element.width() / element.height(), // アスペクト比
        near = 0.1, // 奥行きの表示範囲の最小値
        far = 1000; // 奥行きの表示範囲の最大値

      that.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

      // カメラの注視点
      that.camera.lookAt({
        x: 1,
        y: 0,
        z: 0
      });

      // that.camera.direction = {
      //     x: mainX,
      //     y: mainY,
      //     z: mainZ
      // };

      that.scene.add(that.camera);
    }

    // 形状(球体)の生成
    function buildSphere(that, texture) {
      var radius = 1, // 半径
        widthSegments = 32, // 横方向分割数
        heightSegments = 16, // 縦方向分割数
        phiStart = 0, // φ方向の開始角度
        phiLength = 2 * Math.PI, // φ方向の覆っている角度
        thetaStart, // θ方向の開始角度
        thetaLength, // θ方向の覆っている角度
        matrix; // 球体の内側と外側を反転させる行列

      // 画像の縦横比からθ方向の覆っている範囲を計算
      thetaLength = 2 * Math.PI *
        texture.image.height / texture.image.width;
      if (thetaLength > Math.PI) {
        thetaLength = Math.PI;
      }
      thetaStart = (Math.PI - thetaLength) / 2;

      // 球体を生成
      that.geometry = new THREE.SphereGeometry(
        radius,
        widthSegments,
        heightSegments,
        phiStart,
        phiLength,
        thetaStart,
        thetaLength
      );

      // 球体の内側と外側を反転
      matrix = new THREE.Matrix4().makeScale(1, 1, -1);
      that.geometry.applyMatrix(matrix);
    }

    // 材質の生成
    function buildMaterial(that, texture) {
      that.material = new THREE.MeshBasicMaterial({
        overdraw: true,
        map: texture,
        side: THREE.FrontSide // 外側にのみテクスチャーを貼る
      });
    }

    // 形状+材質(物体)の生成とシーンへの追加
    function createMesh(that) {
      that.mesh = new THREE.Mesh(that.geometry, that.material);
      that.scene.add(that.mesh);
    }

    // イベントリスナーの追加
    function addEventListeners(that, element) {
      var isDragging = false, // ドラッグしている最中か否か
        onMouseDownLat = 0, // マウス押し下げ位置の緯度
        onMouseDownLng = 0, // マウス押し下げ位置の経度
        onMouseDownX = 0, // マウス押し下げ位置のx座標
        onMouseDownY = 0, // マウス押し下げ位置のy座標
        onTouchX = 0, // タッチした位置のx座標
        onTouchY = 0, // タッチした位置のy座標
        camera = that.camera,
        renderer = that.renderer,
        X,
        Y,
        Z,
        dx,
        dy,
        cx,
        cy,
        r,
        isInside = false;


      // 要素のサイズの変更時の処理
      function onResize() {
        camera.aspect = element.width() / element.height();
        camera.updateProjectionMatrix();
        renderer.setSize(element.width(), element.height());
      }

      // マウス押し下げ時の処理
      function onMouseDown(event) {

        dragLog.startEventLog();

        var distance;

        event.preventDefault();

        isDragging = true;

        // マウス押し下げ位置の座標を記録
        onMouseDownLat = camera.lat;
        onMouseDownLng = camera.lng;
        onMouseDownX = event.clientX;
        onMouseDownY = event.clientY;

        //マスクの中心座標とマウス座標との距離を計算
        dx = event.offsetX;
        dy = event.offsetY;
        cx = (parseInt($('#clip').attr('cx')) / 100) * element.width();
        cy = (parseInt($('#clip').attr('cy')) / 100) * element.height();
        r = parseInt($('#clip').attr('r'));

        distance = Math.sqrt(Math.pow((dx - Math.round(cx)), 2) + Math.pow((dy - Math.round(cy)), 2));

        if (distance <= r) isInside = true;

      }

      // マウス移動時の処理
      function onMouseMove(event) {
        var phi, theta;

        camera.lat = mainViewer.camera.lat;
        camera.lng = mainViewer.camera.lng;

        event.preventDefault();

        if (isDragging === true && isInside === false) {
          // 緯度経度を求める
          camera.lat = (event.clientY - onMouseDownY) * 0.1 +
            onMouseDownLat;
          camera.lat = Math.max(-85, Math.min(85, camera.lat));
          camera.lng = (onMouseDownX - event.clientX) * 0.1 +
            onMouseDownLng;

          // 緯度経度からθφを導出
          phi = (90 - camera.lat) * Math.PI / 180;
          theta = camera.lng * Math.PI / 180;

          X = Math.sin(phi) * Math.cos(theta);
          Y = Math.cos(phi);
          Z = Math.sin(phi) * Math.sin(theta);

          camera.lookAt({
            x: X,
            y: Y,
            z: Z
          });

          mainViewer.camera.lookAt({
            x: X,
            y: Y,
            z: Z
          });

          mainViewer.camera.lat = camera.lat;
          mainViewer.camera.lng = camera.lng;

        } else if (isDragging === true && isInside === true) {
          var newX, newY;

          // 新しい中心座標を計算
          newX = cx + (event.offsetX - dx);
          newY = cy + (event.offsetY - dy);

          // 新しい中心座標を％に変換
          newX = (newX / element.width()) * 100;
          newY = (newY / element.height()) * 100;

          $('#clip').attr('cx', newX + '%');
          $('#clip').attr('cy', newY + '%');

          $('.frame').attr('cx', newX + '%');
          $('.frame').attr('cy', newY + '%');

          $(element).css({
            '-webkit-clip-path': 'circle(' + r + 'px at ' + newX + '% ' + newY + '%)',
            'clip-path': 'circle(' + r + 'px at ' + newX + '% ' + newY + '%)'
          });

        }
      }

      // マウス押し上げ時の処理
      function onMouseUp(event) {

        event.preventDefault();

        if (event.clientX !== onMouseDownX || event.clientY !== onMouseDownY) {

          if (isInside && isDragging) {
            dragLog.finishEventLog('lensDrag');
          } else if (isDragging) {
            dragLog.finishEventLog('viewDrag');
          }

          dragLog = new EventLog();
        }

        isDragging = false;
        isInside = false;
      }

      // タッチ時の処理
      function onTouchStart(event) {
        var touch;
        event.preventDefault();
        touch = event.touches[0];

        onTouchX = touch.screenX;
        onTouchY = touch.screenY;
      }


      // タッチしたまま移動した時の処理
      function onTouchMove(event) {
        var touch, phi, theta;
        event.preventDefault();
        touch = event.touches[0];

        lat += (touch.screenY - onTouchY) * 0.2;
        lng -= (touch.screenX - onTouchX) * 0.2;

        onTouchX = touch.screenX;
        onTouchY = touch.screenY;

        // 緯度経度からθφを導出
        phi = (90 - lat) * Math.PI / 180;
        theta = lng * Math.PI / 180;

        camera.lookAt({
          x: Math.sin(phi) * Math.cos(theta),
          y: Math.cos(phi),
          z: Math.sin(phi) * Math.sin(theta)
        });
      }

      // マウスホイール回転時の処理
      function onMouseWheel(event) {
        var fov = camera.fov, // 視野角
          fovMin = 20,
          fovMax = 100;

        event.preventDefault();

        // fovの計算
        // WebKit
        if (event.wheelDeltaY) {
          fov -= event.wheelDeltaY * 0.05;
          // Opera / Internet Explorer
        } else if (event.wheelDelta) {
          fov -= event.wheelDelta * 0.05;
          // Firefox
        } else if (event.detail) {
          fov += event.detail;
        }

        if (fov < fovMin) {
          fov = fovMin;
        }
        if (fov > fovMax) {
          fov = fovMax;
        }

        // fovの適用
        camera.fov = fov;
        camera.updateProjectionMatrix();
        mainViewer.camera.fov = fov;
        mainViewer.camera.updateProjectionMatrix();
      }


      function onContextMenu(event) {
        console.log('context: clone');
        switchLog.finishEventLog('timetravel');
        switchLog = new EventLog();
      }

      // イベントハンドラの設定
      $(element)
        .on("mousedown", onMouseDown)
        .on("mousemove", onMouseMove)
        .on("mouseup", onMouseUp)
        .on("mouseout", onMouseUp)
        .on("resize", onResize)
        .on("contextmenu", onContextMenu);

      // タッチが有効なとき
      if (Modernizr.touch === true) {
        $(element).get(0)
          .addEventListener('touchstart', onTouchStart, false);
        $(element).get(0)
          .addEventListener('touchmove', onTouchMove, false);
      }

      $(element).get(0).addEventListener('mousewheel', onMouseWheel, false);
      $(element).get(0).addEventListener('DOMMouseScroll', onMouseWheel, false);
    }

    // メイン・プログラム
    //ここのthisはMainThetaViewerオブジェクトを指している
    createRenderer(this, element, mode);
    buildScene(this);
    createCamera(this);
    if (mode === "WebGL" || mode === "Canvas") {
      buildSphere(this, texture);
      buildMaterial(this, texture);
      createMesh(this);
    } else if (mode === "CSS3D") {
      createCube(this, texture);
    }
    addEventListeners(this, element);

    this.render = (function(that) {
      return function() {
        requestAnimationFrame(that.render);
        that.renderer.render(that.scene, that.camera);
      };
    }(this));

  }; //CloneThetaViewerクラスはここまで


  /*プラグイン内で使用する関数の定義*/

  // インスタンス生成用
  var mainViewer = {};
  var cloneViewer = {};

  // MainThetaViewerクラスのインスタンスを生成
  function activateMainThetaViewer(that, texture, mode) {
    mainViewer = new MainThetaViewer(that, texture, mode);
    mainViewer.render();
  }

  // CloneThetaViewerクラスのインスタンスを生成
  function activateCloneThetaViewer(that, texture, mode) {
    if (Object.getOwnPropertyNames(cloneViewer).length === 0) {
      cloneViewer = new CloneThetaViewer(that, texture, mode);
      cloneViewer.render();
    }
  }

  function imageLoadError(image_url) {
    alert('loading error: ' + image_url);
  }

  // レンダラーのモードを判別して設定
  function rendererModeSelector() {
    var mode;

    if (Detector.webgl !== null) {
      // WebGLが使用可能
      mode = "WebGL";
    } else if (Modernizr.canvas === true) {
      // Canvasが使用可能
      mode = "Canvas";
    } else {
      // WebGLもCSS Transforms 3Dも使用不可
      alert("WebGL, CSS3 and Canvas Renderer are not available!");
      throw "rendererNotAvailable";
    }
    return mode;
  }

  //Textureの張り替え処理
  function mapMainTexture(texture) {
    mainViewer.material.map = texture;
    mainViewer.material.needsUpdate = true;

  }

  function mapCloneTexture(texture, selector) {
    if (selector == '#clone-viewer') {
      cloneViewer.material.map = texture;
      cloneViewer.material.needsUpdate = true;
    }
  }


  /*jQueryプラグイン化*/

  //画像を切り替える場合
  $.fn.replaceTexture = function(image_url) {

    var selector = this.selector;

    var onload,
      onerror,
      mode,
      loadTexture;

    // テクスチャーのロードが終了時の処理
    function onload(texture) {
      //テキスチャの張り替え

      if (selector == '#main-viewer') {
        mapMainTexture(texture);
      } else {
        mapCloneTexture(texture, selector);
      }
    }

    // テクスチャーのロードが失敗時の処理
    function onerror() {
      imageLoadError(image_url);
    }

    // テクスチャーのロードの処理
    loadTexture = function(mode) {
      var texture = null;

      if (mode === "WebGL" || mode === "Canvas") {
        texture = THREE.ImageUtils.loadTexture(
          image_url,
          new THREE.UVMapping(),
          onload,
          onerror
        );
      }

    };

    mode = rendererModeSelector();
    loadTexture(mode);
  }

  // メインビューア新規作成（起動）
  $.fn.createMainThetaViewer = function(image_url) {
    var onload,
      onerror,
      loadTexture,
      that,
      mode;

    // テクスチャーのロードが終了時の処理
    onload = function(texture) {
      activateMainThetaViewer(that, texture, mode);
    };

    // テクスチャーのロードが失敗時の処理
    onerror = function() {
      imageLoadError(image_url);
    };

    // テクスチャーのロードの処理
    loadTexture = function(mode) {
      var texture = null;

      if (mode === "WebGL" || mode === "Canvas") {
        texture = THREE.ImageUtils.loadTexture(
          image_url,
          new THREE.UVMapping(),
          onload,
          onerror
        );
      }

      return texture;
    };

    that = this;
    mode = rendererModeSelector();
    loadTexture(mode);

    return this;
  };

  // クローンビューア作成（起動）
  $.fn.createCloneThetaViewer = function(image_url) {
    var onload,
      onerror,
      loadTexture,
      that,
      mode;

    // テクスチャーのロードが終了時の処理
    onload = function(texture) {
      activateCloneThetaViewer(that, texture, mode);
    };

    // テクスチャーのロードが失敗時の処理
    onerror = function() {
      imageLoadError(image_url);
    };

    // テクスチャーのロードの処理
    loadTexture = function(mode) {
      var texture = null;

      if (mode === "WebGL" || mode === "Canvas") {
        texture = THREE.ImageUtils.loadTexture(
          image_url,
          new THREE.UVMapping(),
          onload,
          onerror
        );
      }

      return texture;
    };

    that = this;
    mode = rendererModeSelector();
    loadTexture(mode);

    return this;
  };

}(jQuery));
