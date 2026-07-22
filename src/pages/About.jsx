import { motion } from "framer-motion";

const About = () => {
  const services = [
    {
      icon: "🐘",
      title: "Ganesh Models",
      desc: "Beautiful 3D printed Ganesh idols for your home and office",
    },
    {
      icon: "🔤",
      title: "Customized Name Plates",
      desc: "Personalized name plates for homes, offices, and gifts",
    },
    {
      icon: "🖼️",
      title: "Photo Frames",
      desc: "Custom photo frames with intricate 3D designs",
    },
    {
      icon: "🗿",
      title: "Statues",
      desc: "Artistic statues and sculptures for decoration",
    },
    {
      icon: "🏠",
      title: "Home Decor",
      desc: "Unique home decor items to enhance your space",
    },
    {
      icon: "🍳",
      title: "Kitchen Products",
      desc: "Practical and decorative 3D printed kitchen accessories",
    },
  ];

  const processSteps = [
    {
      number: "01",
      title: "Upload Design",
      desc: "Share your design or idea with us",
    },
    {
      number: "02",
      title: "Review & Quote",
      desc: "We review and provide a quote",
    },
    {
      number: "03",
      title: "3D Printing",
      desc: "We print your product with precision",
    },
    {
      number: "04",
      title: "Delivery",
      desc: "We deliver the finished product to you",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-800"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            Aira3D
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300"
          >
            Transforming Ideas Into Reality Through 3D Printing
          </motion.p>
        </div>
      </motion.section>

      <section className="py-16 bg-white dark:bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            About <span className="text-orange-600">Aira3D</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-900 leading-relaxed mb-8 text-center"
          >
            Aira3D is a cutting-edge 3D printing service dedicated to
            transforming creative ideas into tangible products. We combine
            advanced technology with artistic craftsmanship to deliver
            high-quality custom 3D printed items for personal, professional, and
            decorative use. Our mission is to make 3D printing accessible,
            affordable, and exceptional for everyone.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-900 leading-relaxed text-center"
          >
            Whether you need customized gifts, home decor, religious idols, or
            functional prototypes, we bring your vision to life with precision
            and attention to detail. Every product is crafted with premium
            materials and rigorous quality checks.
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            What <span className="text-orange-600">We Offer</span>
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-white dark:bg-gray-50 p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-gray-600 dark:text-gray-800">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            Our <span className="text-orange-600">Process</span>
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="text-center p-6"
              >
                <div className="w-16 h-16 bg-orange-600 text-gray-800 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-800 text-sm">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Our <span className="text-orange-600">Mission</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-900 leading-relaxed">
              Founded in 2024, Aira3D started with a simple vision: make
              advanced 3D printing accessible to everyone. Today, we have grown
              into a trusted name in the industry, serving customers across
              India with innovative designs and impeccable quality. Our journey
              continues as we explore new possibilities in additive
              manufacturing and creative solutions.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;








