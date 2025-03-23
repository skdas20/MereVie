import React, { useState } from 'react';
import FetalVisualization from './FetalVisualization';
import './FetalGrowthPage.css';

const FetalGrowthPage: React.FC = () => {
  const [gestationalAge, setGestationalAge] = useState<number>(12);
  const [fetalInfo, setFetalInfo] = useState<any>(getFetalInfo(12));

  // Function to get fetal development information based on gestational age
  function getFetalInfo(weeks: number) {
    const fetalData = {
      4: {
        size: "0.4 cm (size of a poppy seed)",
        weight: "< 1 gram",
        development: "The neural tube (which becomes the brain and spinal cord) is forming, and the heart begins to develop."
      },
      8: {
        size: "1.6 cm (size of a kidney bean)",
        weight: "1 gram",
        development: "All essential organs have begun to form. Tiny fingers and toes are developing, and the baby's tail is disappearing."
      },
      12: {
        size: "5.4 cm (size of a lime)",
        weight: "14 grams",
        development: "The baby's face is well-formed. Limbs can move, and external genitalia are developing. The baby can make a fist."
      },
      16: {
        size: "11.6 cm (size of an avocado)",
        weight: "100 grams",
        development: "The baby's eyes can make small movements. The skeleton is forming, and the baby can make facial expressions."
      },
      20: {
        size: "25 cm (size of a banana)",
        weight: "300 grams",
        development: "The baby can hear sounds. Hair is growing on the head, and the baby has a regular sleep cycle."
      },
      24: {
        size: "30 cm (size of an ear of corn)",
        weight: "600 grams",
        development: "The baby's lungs are developing rapidly. Fingerprints and footprints are forming."
      },
      28: {
        size: "37 cm (size of an eggplant)",
        weight: "1 kg",
        development: "The baby can open and close eyes. Brain tissue is developing rapidly, and the baby can hiccup."
      },
      32: {
        size: "42 cm (size of a squash)",
        weight: "1.7 kg",
        development: "The baby's bones are fully formed but still soft. The baby is practicing breathing movements."
      },
      36: {
        size: "47 cm (size of a head of romaine lettuce)",
        weight: "2.7 kg",
        development: "The baby's lungs are nearly fully developed. The baby is gaining weight rapidly."
      },
      40: {
        size: "50 cm (size of a small pumpkin)",
        weight: "3.4 kg",
        development: "The baby is fully developed and ready to be born. Most organ systems are mature."
      }
    };

    // Find the closest week in our data
    const availableWeeks = Object.keys(fetalData).map(Number);
    const closestWeek = availableWeeks.reduce((prev, curr) => {
      return (Math.abs(curr - weeks) < Math.abs(prev - weeks) ? curr : prev);
    });

    return fetalData[closestWeek as keyof typeof fetalData];
  }

  const handleWeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWeek = parseInt(event.target.value);
    setGestationalAge(newWeek);
    setFetalInfo(getFetalInfo(newWeek));
  };

  return (
    <div className="fetal-growth-page">
      <h1>Fetal Growth Visualization</h1>
      <p className="description">
        Explore how your baby develops week by week with our interactive 3D visualization.
        Move the slider to see how your baby grows throughout pregnancy.
      </p>

      <div className="week-selector">
        <div className="week-label">Week {gestationalAge}</div>
        <input
          type="range"
          min="4"
          max="40"
          step="1"
          value={gestationalAge}
          onChange={handleWeekChange}
          className="week-slider"
        />
        <div className="week-range">
          <span>4 weeks</span>
          <span>40 weeks</span>
        </div>
      </div>

      <div className="visualization-container">
        <FetalVisualization gestationalAge={gestationalAge} />
      </div>

      <div className="fetal-info-container">
        <h2>Week {gestationalAge} Development</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>Size</h3>
            <p>{fetalInfo.size}</p>
          </div>
          <div className="info-card">
            <h3>Weight</h3>
            <p>{fetalInfo.weight}</p>
          </div>
          <div className="info-card full-width">
            <h3>Development</h3>
            <p>{fetalInfo.development}</p>
          </div>
        </div>
      </div>

      <div className="fetal-milestones">
        <h2>Key Developmental Milestones</h2>
        <div className="milestone-timeline">
          <div className="milestone">
            <div className="milestone-dot"></div>
            <h3>First Trimester (Weeks 1-12)</h3>
            <p>All major organs and external body structures begin to form. The heart begins to beat around week 6.</p>
          </div>
          <div className="milestone">
            <div className="milestone-dot"></div>
            <h3>Second Trimester (Weeks 13-27)</h3>
            <p>The baby begins to move and kick. You may start to feel movement around weeks 18-20. The baby can hear sounds.</p>
          </div>
          <div className="milestone">
            <div className="milestone-dot"></div>
            <h3>Third Trimester (Weeks 28-40)</h3>
            <p>The baby gains weight rapidly. Brain development accelerates. The lungs mature in preparation for birth.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FetalGrowthPage;
