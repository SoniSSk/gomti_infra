"use client";

import CloudinaryStatus from "./component/CloudinaryStatus";
import VehicleCard from "./component/common/VehicleCard";
import Dashboard from "./component/Dashboard";
import ImageUpload from "./component/ImageUpload";
import PdfUpload from "./component/PdfUpload";
import TestMongo from "./component/TestMongo";
import VehicleTable from "./component/vehicle/VehicleTable";
import { vehicleData } from "./constant/vehicleData";

export default function Home() {
  return (
    <>
      <TestMongo />
      {/* <CloudinaryStatus /> */}
      {/* <PdfUpload /> */}
      {/* <ImageUpload /> */}
      <Dashboard />
      {/* <VehicleCard data={vehicleData} /> */}
    </>
  );
}
