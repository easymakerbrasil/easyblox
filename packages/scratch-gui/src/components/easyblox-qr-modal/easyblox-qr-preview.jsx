import PropTypes from 'prop-types';
import React from 'react';

import styles from './easyblox-qr-modal.css';

class EasyBloxQrPreview extends React.Component {
    constructor (props) {
        super(props);

        this.canvas = null;

        this.setCanvasRef =
            this.setCanvasRef.bind(this);
    }

    componentDidMount () {
        this.draw();
    }

    componentDidUpdate () {
        this.draw();
    }

    setCanvasRef (canvas) {
        this.canvas =
            canvas;
    }

    draw () {
        this.props.drawRaster(
            this.canvas,
            this.props.raster
        );
    }

    render () {
        return (
            <canvas
                aria-label={
                    `Prévia do QR Code ${this.props.name}`
                }
                className={styles.previewCanvas}
                ref={this.setCanvasRef}
                role="img"
            />
        );
    }
}

EasyBloxQrPreview.propTypes = {
    drawRaster:
        PropTypes.func.isRequired,
    name:
        PropTypes.string.isRequired,
    raster:
        PropTypes.shape({
            height:
                PropTypes.number.isRequired,
            pixels:
                PropTypes.instanceOf(
                    Uint8ClampedArray
                ).isRequired,
            width:
                PropTypes.number.isRequired
        }).isRequired
};

export default EasyBloxQrPreview;
