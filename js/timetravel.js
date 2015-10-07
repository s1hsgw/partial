(function($) {

    var radius,
        b1_radius,
        b2_radius,
        base_radius,
        b3_radius,
        cx,
        cy,
        running = false; //Time Travelがオンか;

    //Time Travel ビューアを起動
    init();

    //各種機能についての処理（キーボード操作）
    $('html').on("keydown", function(event) {

        //Time Travel UIのフレームサイズ変更
        if (running === true) {

            radius = parseInt($('#clip').attr('r'));
            cx = parseFloat($('#clip').attr('cx'));
            cy = parseFloat($('#clip').attr('cy'));

            switch (event.keyCode) {
                case 38: //フレームを大きくする(Up Arrow)

                    if (radius * 3.0 < window.innerHeight) {

                        radius += 5;

                        resizeFrame();
                    }

                    break;

                case 40: //フレームを小さくする(Down Arrow)

                    if (radius > 70) {

                        radius -= 5;

                        resizeFrame();
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
        var myPromise = $.when($('#main-viewer').createMainThetaViewer('images/experiment/R0010250.JPG'));

        myPromise.done(function() {
            $('#clone-viewer').createCloneThetaViewer('images/experiment/R0010256.JPG');
        });

        //Time travel UIは非表示にしておく
        $('#interface').hide();
    }

    //フレームのサイズ変更時に呼ばれる関数
    function resizeFrame() {

        b1_radius = radius + 2;
        b2_radius = radius + 9.5;
        base_radius = radius + 18;
        b3_radius = radius + 33;

        $('#clip').attr('r', radius + 'px');
        $('#border1').attr('r', b1_radius + 'px');
        $('#border2').attr('r', b2_radius + 'px');
        $('#border3').attr('r', b3_radius + 'px');
        $('#base').attr('r', base_radius + 'px');

        $('#clone-viewer').css({
            '-webkit-clip-path': 'circle(' + radius + 'px at ' + cx + '% ' + cy + '%)',
            'clip-path': 'circle(' + radius + 'px at ' + cx + '% ' + cy + '%)'
        });
    }


}(jQuery));
