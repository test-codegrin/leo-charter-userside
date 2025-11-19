// components/TermsAndConditions.tsx

interface TermsAndConditionsProps {
  className?: string;
}

export default function TermsAndConditions({ className = "" }: TermsAndConditionsProps) {
  return (
    <div className={`font-sans px-4 py-6 text-neutral-300 ${className}`}>
      <h2 className="text-md text-white font-semibold mb-2 md:mb-8">
        Terms and Conditions
      </h2>
      {/* Section 1 */}
      <div className="mb-2">
        <p className="leading-relaxed text-md text-white">
          <span className="font-medium text-white">1.</span> All quotes are prepared based on the client&apos;s specific travel plan and requirements.
        </p>
      </div>

      {/* Section 2 */}
      <div className="mb-2">
        <p className="leading-relaxed text-md text-white">
          <span className="font-medium text-white">2.</span> Total service time is calculated from the driver&apos;s departure from the parking lot until the driver returns to the same location.
        </p>
      </div>

      {/* Section 3 */}
      <div className="mb-2">
        <p className="leading-relaxed text-md text-white">
          <span className="font-medium text-white">3.</span> Overtime / Extra Distance: Each additional hour will be charged at $150, or each additional kilometre at $2, whichever threshold is reached first.
        </p>
      </div>

      {/* Section 4 */}
      <div className="mb-2">
        <p className="leading-relaxed text-md text-white">
          <span className="font-medium text-white">4.</span> Payment Methods: We accept online payments by debit card, credit card, PayPal or e-transfer. For other payment options, such as e-transfer or EFT, please contact{" "}
          <a 
            href="mailto:info@leocharterservices.com" 
            className="text-blue-400 underline"
          >
            info@leocharterservices.com
          </a>{" "}
          for assistance.
        </p>
      </div>

      {/* Section 5 */}
      <div className="mb-2">
        <p className="leading-relaxed text-md text-white">
          <span className="font-medium text-white">5.</span> Please inform us promptly of any changes to your itinerary once a booking has been confirmed. To ensure smooth scheduling, we recommend finalizing your itinerary at least one week prior to the service date.
        </p>
      </div>

      {/* Section 6 - Refund Policy */}
      <div className="mb-2">
        <p className="leading-relaxed text-md mb-3 text-white">
          <span className="font-medium text-white">6.</span> Refund Policy:
        </p>
        <ul className="ml-6 space-y-2 text-md list-disc list-outside text-white">
          <li className="leading-relaxed">
            Full refund for cancellations made more than 30 days before the service start date.
          </li>
          <li className="leading-relaxed">
            50% refund for cancellations made 8 - 30 days prior to the service start date
          </li>
          <li className="leading-relaxed">
            No refund for cancellations made 7 days or within 7 days prior to the service start date.
          </li>
        </ul>
        <p className="mt-3 text-md leading-relaxed text-white">
          Please email{" "} 
          <a 
            href="mailto:info@leocharterservices.com" 
            className="text-blue-400 underline"
          >
            info@leocharterservices.com
          </a>{" "}
          for any change or cancellation requests.
        </p>
      </div>

      {/* Section 7 */}
      <div className="mb-2">
        <p className="leading-relaxed text-md text-white">
          <span className="font-medium text-white">7.</span> Clients are responsible for maintaining the 
          cleanliness of the vehicle during service and must not distract the driver while they are operating 
          the vehicle.
        </p>
      </div>

      {/* Section 8 */}
      <div className="mb-2">
        <p className="leading-relaxed text-md text-white">
          <span className="font-medium text-white">8.</span> Clients are liable for any damages to the vehicle 
          caused by their group. This includes excessive cleaning required for spills or bodily fluids. A minimum 
          charge of $150.00 plus tax will apply, subject to actual cleaning or repair costs.
        </p>
      </div>

      {/* Section 9 */}
      <div className="mb-2">
        <p className="leading-relaxed text-md text-white">
          <span className="font-medium text-white">9.</span> Leo Charter Services is not liable for delays 
          caused by unforeseen circumstances such as road closures, weather conditions, or other factors beyond 
          our control. We will communicate promptly and work with the client to find suitable solutions where 
          possible.
        </p>
      </div>

      {/* Section 10 - Booking Cancellations */}
      <div className="mb-2">
        <p className="leading-relaxed text-md mb-3 text-white">
          <span className="font-medium text-white">10.</span> Booking Cancellations by Leo Charter Services:
        </p>
        <p className="leading-relaxed text-md mb-3 text-white">
          Leo Charter Services reserves the right to cancel a booking under certain circumstances, including 
          but not limited to:
        </p>
        <ul className="ml-6 space-y-2 text-md list-disc list-outside text-white">
          <li className="leading-relaxed">
            Non-payment: Failure to make payment by the due date.
          </li>
          <li className="leading-relaxed">
            Violation of terms: Breach of these Terms & Conditions or disruptive behaviour impacting service delivery
          </li>
          <li className="leading-relaxed">
            Force Majeure: Events beyond our control, such as natural disasters, civil unrest, or government 
            regulations. In such cases, clients will receive a full refund.
          </li>
        </ul>
      </div>

      {/* Section 11 */}
      <div className="mb-2">
        <p className="leading-relaxed text-md text-white">
          <span className="font-medium text-white">11.</span> Consumption of alcohol on board requires prior 
          written approval from Leo Charter Services. Please contact us in advance if this applies to your event.
        </p>
      </div>

      {/* Section 12 */}
      <div className="mb-2">
        <p className="leading-relaxed text-md text-white">
          <span className="font-medium text-white">12.</span> During peak seasons, vehicle availability and 
          rates are subject to daily change. Quotes are not guaranteed until a booking has been confirmed.
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 text-md flex gap-2">
        <p className="leading-relaxed mb-2 text-white">
          For more information, please visit
        </p>
        <a 
          href="https://www.leocharterservices.com" 
          className="text-blue-400 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.leocharterservices.com
        </a>
      </div>
    </div>
  );
}
