"use client";
import { useState } from "react";
import AssistantPage from "./AssistantPage";
import { AssistantPreProduction, type ProductionSelection } from "@/components/assistant/AssistantPreProduction";
export default function CreateProductionGate(){const[selection,setSelection]=useState<ProductionSelection|null>(null);return selection?<AssistantPage preProduction={selection}/>:<AssistantPreProduction onConfirm={setSelection}/>;}
