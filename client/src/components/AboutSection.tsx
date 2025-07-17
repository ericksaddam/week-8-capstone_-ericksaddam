import React from 'react';
import { Globe, Heart, Users } from 'lucide-react';

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">About Harambee Hub</h2>
          <p className="text-lg text-gray-600 mt-2">Our mission, vision, and the values that drive us.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="inline-block p-4 bg-primary rounded-full text-white mb-4">
              <Globe className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Our Mission</h3>
            <p className="text-gray-500">
              To empower communities by providing a collaborative platform that streamlines club activities, enhances task management, and fosters a spirit of unity and collective achievement.
            </p>
          </div>
          <div className="p-6">
            <div className="inline-block p-4 bg-primary rounded-full text-white mb-4">
              <Heart className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Our Vision</h3>
            <p className="text-gray-500">
              We envision a world where every community can effortlessly pull together for common purposes, achieving more together than ever before and creating lasting positive change.
            </p>
          </div>
          <div className="p-6">
            <div className="inline-block p-4 bg-primary rounded-full text-white mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Our Values</h3>
            <p className="text-gray-500">
              Community, Collaboration, Transparency, and a commitment to fostering growth and empowerment are at the heart of everything we do.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
