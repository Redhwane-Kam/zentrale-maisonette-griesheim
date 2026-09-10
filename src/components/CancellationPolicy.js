import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import "./CancellationPolicy.css";

export default function CancellationPolicy() {
  const { t } = useLanguage();
  const c = t.cancellation;

  return (
    <div className="cancellation-policy">
      <h3>{c.title}</h3>

      <div className="cancellation-block">
        <h4>{c.shortStayTitle}</h4>
        <p className="cancellation-intro">{c.shortStayIntro}</p>
        <ul>
          <li>{c.shortStayRule1}</li>
          <li>{c.shortStayRule2}</li>
          <li>{c.shortStayRule3}</li>
        </ul>
      </div>

      <div className="cancellation-block">
        <h4>{c.longStayTitle}</h4>
        <p className="cancellation-intro">{c.longStayIntro}</p>
        <ul>
          <li>{c.longStayRule1}</li>
          <li>{c.longStayRule2}</li>
        </ul>
      </div>

      <div className="cancellation-block">
        <h4>{c.nonRefundableTitle}</h4>
        <p>{c.nonRefundableText}</p>
      </div>

      <p className="cancellation-legal">{c.noWithdrawalRight}</p>
    </div>
  );
}
