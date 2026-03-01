export default function StatisticsStrip() {
  const stats = [
    {
      icon: '/assets/generated/icon-location-pin.dim_48x48.png',
      value: '50,000+',
      label: 'Reports Submitted',
    },
    {
      icon: '/assets/generated/icon-checkmark-green.dim_32x32.png',
      value: '2000+',
      label: 'Issues Resolved',
    },
    {
      icon: '/assets/generated/icon-buildings.dim_48x48.png',
      value: '500+',
      label: 'Active Areas',
    },
    {
      icon: '/assets/generated/icon-people.dim_48x48.png',
      value: '10,000+',
      label: 'Registered Citizens',
    },
  ];

  return (
    <section className="border-y bg-beige py-12">
      <div className="container px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center">
                <img src={stat.icon} alt={stat.label} className="h-full w-full object-contain" />
              </div>
              <div className="mb-1 text-4xl font-bold text-navy md:text-5xl">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-navy/60 md:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
