import React, { useEffect, useRef, useState, ReactChildren } from "react";
import { Link, canUseDOM } from "vtex.render-runtime";

// Styles
import styles from "./styles.css";

interface CarouselSliderProps {
  children: ReactChildren | any
  pauseOnHover: boolean
  autoFlip: boolean
  secondsBetweenFlips: number
  showDots: boolean
  blockClass: string
}

const minimumFlipSeconds = 3;

const CarouselSlider: StorefrontFunctionComponent<CarouselSliderProps> = ({ children, autoFlip, pauseOnHover, secondsBetweenFlips, showDots }) => {
  const windowWidth = useRef<number>(0);
  const train = useRef<any>();
  const appTimer = useRef<any>();

  const [pauseApp, setPauseApp] = useState(false);
  const [loopFlag, setLoopFlag] = useState(false);
  const [trainPosition, setTrainPosition] = useState(0);
  const [activeCar, setActiveCar] = useState(0);
  const [hideSRSection, setHideSRSection] = useState(true);

  useEffect(() => {
    // If AutoFlip is off or if a keyboard user has activated the SR section, prevent timer. - LM
    if (!autoFlip || !hideSRSection) return;

    appTimer.current = setTimeout(() => {
      if (pauseOnHover) {
        if (!pauseApp) advanceTrain();
      } else {
        advanceTrain();
      }
    }, (secondsBetweenFlips < minimumFlipSeconds ? minimumFlipSeconds : secondsBetweenFlips) * 1000);

    return () => {
      clearInterval(appTimer.current);
    }
  });

  useEffect(() => {
    train.current.addEventListener("transitionend", handleTrainStop);

    return () => {
      train.current.removeEventListener("transitionend", handleTrainStop);
    }
  });

  // Side effect for activeCar update gets current width of 
  // window in event the user has resized their browser - LM
  useEffect(() => {
    if (!canUseDOM) return;

    windowWidth.current = window.innerWidth;
    setTrainPosition(0 - (windowWidth.current * activeCar));
  }, [activeCar]);

  // If activeCar is the duplicate first car, inactivate
  // transition property, snap to 0px and re-activate transition. - LM
  const handleTrainStop = () => {
    if (activeCar >= children.length) {
      setLoopFlag(true);
      setActiveCar(0);
      setTimeout(() => setLoopFlag(false), 500);
    }
  }

  const advanceTrain = () => {
    setActiveCar(activeCar + 1);
  }

  const handleDotClick = (e: any) => {
    const clickedDot = Number(e.target.dataset.number);
    setActiveCar(clickedDot);
  }

  const pauseAppTimer = () => {
    setPauseApp(true);
  }

  const resumeAppTimer = () => {
    setPauseApp(false);
  }

  const showSRSection = () => {
    setHideSRSection(false);
  }

  return (<>
    <section aria-labelledby="featuredContentTitle" data-sr-only={hideSRSection}>
      <h2 id="featuredContentTitle" className={styles.srFeaturedTitle}>Featured Links</h2>
      {hideSRSection && <button onFocus={showSRSection}></button>}
      <ul className={styles.srList} aria-labelledby="featuredContentTitle">
        {children.map((child: any, index: number) => (
          <li key={`fc-${index}`} className={styles.srListItem}>
            {child}
          </li>
        ))}
      </ul>
    </section>

    {/* The below section is not WCAG compliant so it is hidden from the accessibility tree
    and the content is duplicated above in a more easily navigatable style. Keyboard users
    who navigate with the TAB key will trigger this above content to be visible. - LM */}

    <section aria-hidden="true" className={styles.container} onMouseEnter={pauseAppTimer} onMouseLeave={resumeAppTimer} style={{ display: `${hideSRSection ? "block" : "none"}` }}>
      <div className={styles.tracks}>
        <div ref={train} style={{ transform: `translateX(${trainPosition}px)` }} data-loop={loopFlag} className={styles.train}>
          {children.map((child: any, index: number) => (
            <div key={`car-${index}`} className={styles.car}>{child}</div>
          ))}
          <div data-duplicate-first-car className={styles.car}>
            {children[0]}
          </div>
        </div>
      </div>
      {showDots &&
        <div className={styles.dotsContainer}>
          {children.map((child: any, index: number) => (
            <button
              key={child.props.id}
              tabIndex={-1}
              data-number={index}
              data-active-dot={activeCar === index ? "true" : "false"}
              onClick={handleDotClick}
              className={styles.dot} ></button>
          ))}
        </div>
      }
    </section>
  </>
  );
};

CarouselSlider.schema = {
  title: "CarouselSlider",
  description: "",
  type: "object",
  properties: {
    autoFlip: {
      title: "Auto Flip?",
      type: "boolean"
    },
    pauseOnHover: {
      title: "Pause on Mouse Hover?",
      type: "boolean"
    },
    showDots: {
      title: "Show Pagination Dots?",
      type: "boolean"
    },
    secondsBetweenFlips: {
      title: "Seconds Between Flips",
      type: "number"
    }
  }
};

export default CarouselSlider;

