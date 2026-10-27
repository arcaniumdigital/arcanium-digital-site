import styles from "@/app/seller-demo/seller-demo.module.css";

const ghlSurveyUrl = "https://api.leadconnectorhq.com/widget/survey/9jZ5y1quM7WTPOVQ94ef";

export function SellerDemo() {
  return (
    <div className={styles.phoneFrame} data-clarity-mask="true">
      <iframe
        src={ghlSurveyUrl}
        title="Arcanium seller AI demo"
        className={styles.ghlSurveyFrame}
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
