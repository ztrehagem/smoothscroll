var w = window;
var d = document;

var Element = w.HTMLElement || w.Element;
var SCROLL_TIME = 468;

var now = w.performance && w.performance.now
  ? w.performance.now.bind(w.performance) : Date.now;

/**
 * changes scroll position inside an element
 * @method scrollElement
 * @param {Number} x
 * @param {Number} y
 */
function scrollElement(x, y) {
  this.scrollLeft = x;
  this.scrollTop = y;
}

/**
 * returns result of applying ease math function to a number
 * @method ease
 * @param {Number} k
 * @returns {Number}
 */
function ease(k) {
  return 0.5 * (1 - Math.cos(Math.PI * k));
}

/**
 * finds scrollable parent of an element
 * @method findScrollableParent
 * @param {Node} el
 * @returns {Node} el
 */
function findScrollableParent(el) {
  var isBody;
  var hasScrollableSpace;
  var hasVisibleOverflow;

  do {
    el = el.parentNode;

    // set condition variables
    isBody = el === d.body;
    hasScrollableSpace =
      el.clientHeight < el.scrollHeight ||
      el.clientWidth < el.scrollWidth;
    hasVisibleOverflow =
      w.getComputedStyle(el, null).overflow === 'visible';
  } while (!isBody && !(hasScrollableSpace && !hasVisibleOverflow));

  isBody = hasScrollableSpace = hasVisibleOverflow = null;

  return el;
}

/**
 * self invoked function that, given a context, steps through scrolling
 * @method step
 * @param {Object} context
 */
function step(context) {
  var time = now();
  var value;
  var currentX;
  var currentY;
  var elapsed = (time - context.startTime) / SCROLL_TIME;

  // avoid elapsed times higher than one
  elapsed = elapsed > 1 ? 1 : elapsed;

  // apply easing to elapsed time
  value = ease(elapsed);

  currentX = context.startX + (context.x - context.startX) * value;
  currentY = context.startY + (context.y - context.startY) * value;

  context.method.call(context.scrollable, currentX, currentY);

  // scroll more if we have not reached our destination
  if (currentX !== context.x || currentY !== context.y) {
    w.requestAnimationFrame(step.bind(w, context));
  }
}

function smoothScroll(el, x, y) {
  if (el === d.body) {
    step({
      scrollable: w,
      startX: w.scrollX || w.pageXOffset,
      startY: w.scrollY || w.pageYOffset,
      method: w.scroll || w.scrollTo,
      startTime: now(),
      x,
      y,
    });
  } else {
    step({
      scrollable: el,
      startX: el.scrollLeft,
      startY: el.scrollTop,
      method: scrollElement,
      startTime: now(),
      x,
      y,
    });
  }
}

function scrollBy(left, top) {
  smoothScroll(
    d.body,
    ~~left + (w.scrollX || w.pageXOffset),
    ~~top + (w.scrollY || w.pageYOffset)
  );
};

module.exports = function smoothScrollToElement(element) {
  var scrollableParent = findScrollableParent(element);
  var parentRects = scrollableParent.getBoundingClientRect();
  var clientRects = element.getBoundingClientRect();

  if (scrollableParent !== d.body) {
    smoothScroll(
      scrollableParent,
      scrollableParent.scrollLeft + clientRects.left - parentRects.left,
      scrollableParent.scrollTop + clientRects.top - parentRects.top
    );
    scrollBy(parentRects.left, parentRects.top);
  } else {
    scrollBy(clientRects.left, clientRects.top);
  }
};
