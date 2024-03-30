import React from 'react';
import Image from 'next/image';
import imageSrc from './full_logo.png';

const ImageComponent: React.FC = () => {
  return <Image src={imageSrc} alt="Logo" width={200} height={200} />;
};

export default ImageComponent;
