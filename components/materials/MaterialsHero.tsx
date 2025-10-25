import React from 'react';

export default function MaterialsHero() {
  return (
    <section className="mb-8 md:mb-10">
      <h1 
        className="text-3xl md:text-4xl font-bold mb-3 animate-fade-in-up opacity-0 [--animation-delay:60ms]"
        style={{ animationFillMode: 'forwards' }}
      >
        Materialien entdecken
      </h1>
      <p className="text-muted-foreground max-w-2xl animate-fade-in-up opacity-0 [--animation-delay:120ms]" style={{ animationFillMode: 'forwards' }}>
        Informieren Sie sich über Materialien, sehen Sie Bilder und finden Sie passende Recyclinghöfe in Ihrer Nähe.
      </p>
    </section>
  );
}


