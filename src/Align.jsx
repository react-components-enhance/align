import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import align from 'dom-align';
import addEventListener from 'rc-util/lib/Dom/addEventListener';
import shallowequal from 'shallowequal';
import isWindow from './isWindow';

function buffer(fn, ms) {
  let timer;

  function clear() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function bufferFn() {
    clear();
    timer = setTimeout(fn, ms);
  }

  bufferFn.clear = clear;

  return bufferFn;
}

class Align extends Component {
  static propTypes = {
    childrenProps: PropTypes.object,
    align: PropTypes.object.isRequired,
    target: PropTypes.func,
    onAlign: PropTypes.func,
    monitorBufferTime: PropTypes.number,
    monitorWindowResize: PropTypes.bool,
    monitorWindowScroll: PropTypes.bool,
    disabled: PropTypes.bool,
    children: PropTypes.any,
  };

  static defaultProps = {
    target: () => window,
    onAlign: () => {},
    monitorBufferTime: 50,
    monitorWindowResize: false,
    monitorWindowScroll: false,
    disabled: false,
  };

  componentDidMount() {
    const props = this.props;
    // if parent ref not attached .... use document.getElementById
    this.forceAlign();
    if (!props.disabled && props.monitorWindowResize) {
      this.startMonitorWindowResize();
    }
    if (!props.disabled && props.monitorWindowScroll) {
      this.startMonitorWindowScroll();
    }
  }

  componentDidUpdate(prevProps) {
    let reAlign = false;
    const props = this.props;

    if (!props.disabled) {
      if (prevProps.disabled || !shallowequal(prevProps.align, props.align)) {
        reAlign = true;
      } else {
        const lastTarget = prevProps.target();
        const currentTarget = props.target();
        if (isWindow(lastTarget) && isWindow(currentTarget)) {
          reAlign = false;
        } else if (lastTarget !== currentTarget) {
          reAlign = true;
        }
      }
    }

    if (reAlign) {
      this.forceAlign();
    }

    if (props.monitorWindowResize && !props.disabled) {
      this.startMonitorWindowResize();
    } else {
      this.stopMonitorWindowResize();
    }
    if (props.monitorWindowScroll && !props.disabled) {
      this.startMonitorWindowScroll();
    } else {
      this.stopMonitorWindowScroll();
    }
  }

  componentWillUnmount() {
    this.stopMonitorWindowResize();
    this.stopMonitorWindowScroll();
  }

  startMonitorWindowResize() {
    if (!this.resizeHandler) {
      this.bufferMonitor = buffer(this.forceAlign, this.props.monitorBufferTime);
      this.resizeHandler = addEventListener(window, 'resize', this.bufferMonitor);
    }
  }

  stopMonitorWindowResize() {
    if (this.resizeHandler) {
      this.bufferMonitor.clear();
      this.resizeHandler.remove();
      this.resizeHandler = null;
    }
  }
  startMonitorWindowScroll() {
    if (!this.scrollHandler) {
      this.scrollMonitor = buffer(this.forceAlign, this.props.monitorBufferTime);
      window.addEventListener('scroll', this.scrollMonitor, true);
      this.scrollHandler = true;
    }
  }

  stopMonitorWindowScroll() {
    if (this.scrollHandler) {
      this.scrollMonitor.clear();
      window.removeEventListener('scroll', this.scrollMonitor, true);
      this.scrollHandler = null;
    }
  }

  forceAlign = () => {
    const props = this.props;
    if (!props.disabled) {
      const source = ReactDOM.findDOMNode(this);
      props.onAlign(source, align(source, props.target(), props.align));
    }
  }

  render() {
    const { childrenProps, children } = this.props;
    const child = React.Children.only(children);
    if (childrenProps) {
      const newProps = {};
      for (const prop in childrenProps) {
        if (childrenProps.hasOwnProperty(prop)) {
          newProps[prop] = this.props[childrenProps[prop]];
        }
      }
      return React.cloneElement(child, newProps);
    }
    return child;
  }
}

export default Align;
