// components/TermsAndConditions.tsx

interface TermsAndConditionsProps {
  className?: string;
}

export default function TermsAndConditions({ className = "" }: TermsAndConditionsProps) {
  const terms = [
    "Quotes are built based on each client's plan.",
    "Total service time counts from driver's departure point at parking lot till returning to the same parking lot.",
    "For overtime/extra distance: each additional hour is $130, or each additional km is $2, whichever reaches the limit first.",
    "A 50% deposit is required upfront to secure the booking; the remaining balance is due 7 days before the service starts.",
    {
      text: "We accept online payment by debit/credit/PayPal/E-transfer to ",
      link: {
        text: "info@leocharterservices.com",
        href: "mailto:info@leocharterservices.com"
      },
      suffix: "."
    },
    "Please keep us informed of any plan changes once the booking has been confirmed.",
    "No refund for cancellation within 30 days prior to the booked service date.",
    "Leo Charter Services is not liable for delays caused by unforeseeable circumstances such as road conditions, weather, or any other conditions beyond its control. The company will communicate and work with the clients in a timely manner to provide the appropriate solutions in particular situations.",
    "The clients are responsible for keeping the vehicle clean during the service and ensuring no disruption to the driver while the driver performs their duty on the road.",
    "The client will be responsible for vehicle damage caused by their passengers. Damages include excessive cleaning, such as carpet cleaning for spilled beverages and bodily fluids. A minimum charge of $150.00 plus GST will be payable depending on the actual repair/cleaning costs.",
    "Please contact us in advance for permission if you wish to drink alcohol in the vehicle for your special function in Alberta."
  ];

  return (
    <div className={`${className}`}>
      <h2 className="text-lg text-white mb-6">Terms & Conditions</h2>
      
      <ol className="space-y-4 text-neutral-400 leading-snug">
        {terms.map((term, index) => (
          <li key={index} className="flex gap-3">
            <span className="font-medium text-neutral-400">{index + 1}.</span>
            <span>
              {typeof term === "string" ? (
                term
              ) : (
                <>
                  {term.text}
                  <a 
                    href={term.link.href} 
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {term.link.text}
                  </a>
                  {term.suffix}
                </>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
