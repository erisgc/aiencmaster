import { DayPicker, DateRange } from "react-day-picker";
import styles from "./DateRangePicker.module.css";

type Props = {
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
};

export default function DateRangePicker({ range, onChange }: Props) {
  return (
    <div className={styles.wrapper}>
      <DayPicker
        mode="range"
        selected={range}
        onSelect={onChange}
        captionLayout="dropdown"
        fromYear={2020}
        toYear={2035}
        showOutsideDays
      />
    </div>
  );
}
