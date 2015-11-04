(function($) {

    var radius = window.innerWidth * 0.1, //画面横幅の10%がクリップパスの半径
        frame_radius,
        cx,
        cy,
        sw,
        ratio = 0.03,
        running = false; //Time Travelがオンか;

    //Time Travel ビューアを起動
    init();

    //各種機能についての処理（キーボード操作）
    $('html').on("keydown", function(event) {

        //Time Travel UIのフレームサイズ変更
        if (running === true) {

            //フレーム関連の変数取得
            radius = parseInt($('#clip').attr('r'));
            cx = parseFloat($('#clip').attr('cx'));
            cy = parseFloat($('#clip').attr('cy'));
            sw = parseFloat($('#base').attr('stroke-width'));

            switch (event.keyCode) {
                case 38: //フレームを大きくする(Up Arrow)

                    if (radius * 3.0 < window.innerHeight) {

                        radius += 5;

                        resizeFrame();
                        resetClipPath();
                    }

                    break;

                case 40: //フレームを小さくする(Down Arrow)

                    if (radius > 70) {

                        radius -= 5;

                        resizeFrame();
                        resetClipPath();
                    }

                    break;
            }

        }

        //Time Travel UIの起動・終了
        if (event.keyCode == '32') { //Space Bar
            $('#clone-viewer').toggle();
            $('#interface').toggle();

            if ($('#interface').css('display') == 'inline') {
                $('.svgout').css('z-index', 2);
                running = true;
            } else if ($('#interface').css('display') == 'none') {
                $('.svgout').css('z-index', 0);
                running = false;
            }

        }

    });

    //初期設定関数
    function init() {
        //２つのビューアを順番に起動
        var myPromise = $.when($('#main-viewer').createMainThetaViewer('images/experiment/present.jpg'));

        myPromise.done(function() {
            $('#clone-viewer').createCloneThetaViewer('images/experiment/hakubishin_test.png');
        });

        //フレームのサイズ設定
        resizeFrame();

        //Time travel UIは非表示にしておく
        $('#interface').hide();
    }

    //フレームのサイズ変更時に呼ばれる関数
    function resizeFrame() {

        sw = ratio * (radius * 2); //直径の３％が枠の太さになるように設定
        frame_radius = radius + (sw / 2);

        $('#clip').attr('r', radius + 'px');
        $('#base').attr('r', frame_radius + 'px');
        $('#base').attr('stroke-width', sw + 'px');

    }

    //クリップパス再定義
    function resetClipPath() {
        $('#clone-viewer').css({
            '-webkit-clip-path': 'circle(' + radius + 'px at ' + cx + '% ' + cy + '%)',
            'clip-path': 'circle(' + radius + 'px at ' + cx + '% ' + cy + '%)'
        });
    }


}(jQuery));
