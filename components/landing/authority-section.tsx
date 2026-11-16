import Image from "next/image";
const testimonials = [
  {
    avatar: "/images/testimonials/mary-ann-mcloughlin.jpg",
    quote: "What I value about Arcanium is the focus on the whole appraisal process, from the first seller enquiry through to follow-up and booking. It is a done-for-you service built around helping agents focus on their clients.",
    name: "Mary-Ann McLoughlin",
    role: "Real estate agent",
    market: "Sunshine Coast",
  },
  {
    avatar: "/images/testimonials/shana.jpg",
    quote: "The process has felt considered and professional from the start. Jordan takes the time to listen and understand what matters to my business. That personal approach is what I value about working with Arcanium.",
    name: "Shana Feng",
    role: "Real estate agent",
    market: "Brisbane",
  },
  {
    avatar: "/images/testimonials/kael-sharp.jpg",
    quote: "Jordan is a driven young professional who genuinely looks for ways to create value. He listens carefully, brings practical ideas, and stays focused on outcomes.",
    name: "Kael Sharp",
    role: "Estate Agent",
    market: "Sydney",
  },
];

export function AuthoritySection() {
  return <section id="testimonials" className="mv-section mv-shell" aria-label="Client testimonials"><div className="mv-testimonials">{testimonials.map(testimonial => <figure key={testimonial.name}><blockquote>“{testimonial.quote}”</blockquote><figcaption><Image src={testimonial.avatar} alt={testimonial.name} width={56} height={56} sizes="56px" /><div><strong>{testimonial.name}</strong><span>{testimonial.role}, {testimonial.market}</span></div></figcaption></figure>)}</div></section>;
}
