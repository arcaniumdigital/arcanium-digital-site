import { Check, MessageSquare, ShieldCheck } from "lucide-react";
import styles from "@/app/seller-demo/seller-demo.module.css";

const ghlFormUrl = "https://api.leadconnectorhq.com/widget/form/ERdSLQAPVw4E41yvSYBz";

export function SellerDemo() {
  return (
    <div className={styles.experience} data-clarity-mask="true">
      <section className={styles.leadPanel} aria-labelledby="practice-heading">
        <div className={styles.sectionTitle}>
          <span className={styles.step}>1</span>
          <h2 id="practice-heading">Your demo enquiry</h2>
        </div>
        <p className={styles.panelCopy}>
          Use your own Australian mobile and fictional property details. Submit once, then continue the conversation by SMS.
        </p>
        <iframe
          src={ghlFormUrl}
          title="Jordan property demo enquiry"
          className={styles.ghlFormFrame}
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </section>

      <section className={styles.chatPanel} aria-labelledby="conversation-heading">
        <div className={styles.sectionTitle}>
          <span className={styles.step}>2</span>
          <h2 id="conversation-heading">Continue by SMS</h2>
        </div>
        <div className={styles.smsExplainer}>
          <MessageSquare size={38} strokeWidth={1.4} aria-hidden="true" />
          <h3>A real AI conversation.<br />In a safe demo account.</h3>
          <p>
            After submitting the form, Jordan&apos;s property demo assistant will start the conversation on the mobile number you entered. Reply naturally, ask questions, or try an objection.
          </p>
          <ul>
            <li><ShieldCheck size={17} aria-hidden="true" /><span>No email, live calendar booking, agent notification, or human handoff.</span></li>
            <li><Check size={17} aria-hidden="true" /><span>Fictional property details stay inside the isolated demonstration account.</span></li>
            <li><Check size={17} aria-hidden="true" /><span>Submit once, then continue the same conversation from your phone.</span></li>
          </ul>
          <div className={styles.example}>
            <span>Try replying</span>
            <q>I&apos;m just curious. I don&apos;t want to sell yet.</q>
            <p>See how the assistant responds rather than reading a pre-written script.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
