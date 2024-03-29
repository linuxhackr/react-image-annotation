import React, {useEffect, useRef, useState} from "react";
import {Arrow, Group, Image, Layer, Rect, Stage} from "react-konva";
import {StickyNote} from "./StickyNote";
import Edge from "./Edge";
import Marker from "./Marker";
import {Button, Icon} from "@mui/material";

const DrawAnnotations = ({image, prev_annotations,onAnnotationChange, clear, onBack}) => {
        const [annotations, setAnnotations] = useState(prev_annotations); // marker, label
        const [newRect, setNewRect] = useState([]);
        const [isDrawing, setIsDrawing] = useState(true)
        const [selected, setSelected] = useState(null)

        const stageRef = useRef(null)
        const handleMouseDown = event => {
            if (isDrawing && newRect.length === 0) {
                const {x, y} = event.target.getStage().getPointerPosition();
                setNewRect([{x, y, width: 0, height: 0, key: "0"}]);
            }
        };

        useEffect(()=>{
            onAnnotationChange(annotations)
        }, [annotations])

        const handleMouseUp = event => {
            if (newRect.length === 1) {
                const sx = newRect[0].x;
                const sy = newRect[0].y;
                const {x, y} = event.target.getStage().getPointerPosition();
                const rectToAdd = {
                    x: sx,
                    y: sy,
                    width: x - sx,
                    height: y - sy,
                    key: annotations.length + 1
                };
                annotations.push({marker: rectToAdd});
                setNewRect([]);
                setAnnotations(annotations);

                setAnnotations(annotations.map((item) => {
                    if (!item.label)
                        return {
                            ...item,
                            label: {
                                x: x + (x - sx) / 2,
                                y: y - (y - sy) / 4,
                                width: 150,
                                height: 16,
                                text: '',
                                selected: true
                            }
                        }
                    return item
                }))

            }
        };

        const handleMouseMove = event => {
            if (newRect.length === 1) {
                const sx = newRect[0].x;
                const sy = newRect[0].y;
                const {x, y} = event.target.getStage().getPointerPosition();
                setNewRect([
                    {
                        x: sx,
                        y: sy,
                        width: x - sx,
                        height: y - sy,
                        key: "0"
                    }
                ]);
            }
        };

        function downloadURI(uri, name) {
            var link = document.createElement('a');
            link.download = name;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        const handleExport = () => {
            setSelected(null)
            setTimeout(() => {
                const uri = stageRef.current.toDataURL();
                downloadURI(uri, 'exported_sample.png')
            }, 1000)
        };


        const removeAnnotation = (e) => {
            if (e.keyCode === 8 || e.keyCode === 46) {
                setAnnotations(annotations.filter((item, i) => selected !== i))
            }
            setSelected(null)
            setIsDrawing(true)
        }

        useEffect(() => {
            document.addEventListener('keydown', removeAnnotation, false)
            return () => {
                document.removeEventListener('keydown', removeAnnotation, false);
            }
        }, [selected, annotations])


        if (!image) {
            return null
        }

        let max = window.innerWidth > 800 ? 800 : window.innerWidth;
        let ratio = (image.width > image.height ? (image.width / max) : (image.height / max));
        return (
            <div style={{width: image.width / ratio, margin: "auto"}} className='self-center flex flex-col space-y-12'>
                <Stage

                    onTouchStart={handleMouseDown}
                    onMouseDown={handleMouseDown}

                    onTouchEnd={handleMouseUp}
                    onMouseUp={handleMouseUp}

                    onTouchMove={handleMouseMove}
                    onMouseMove={handleMouseMove}
                    width={image.width / ratio}
                    height={image.height / ratio}
                    ref={stageRef}
                >
                    <Layer>
                        {image && (
                            <Image
                                x={0}
                                y={0}
                                image={image}
                                width={image.width / ratio}
                                height={image.height / ratio}
                                onMouseEnter={(e) => {
                                    if (annotations.length < 1) {
                                        const container = e.target.getStage().container();
                                        container.style.cursor = "crosshair";
                                    }
                                }}
                            />
                        )}
                        {annotations.map((annotation, index) => {
                            return (
                                <>
                                    {annotation.marker && annotation.label &&
                                    <Edge node1={annotation.marker} node2={annotation.label}/>}

                                    {annotation.label && (
                                        <StickyNote
                                            x={annotation.label.x}
                                            y={annotation.label.y}
                                            height={annotation.label.height}
                                            width={annotation.label.width}
                                            text={annotation.label.text}
                                            colour="#FFDAE1"
                                            onTextChange={(text) => {
                                                setAnnotations(annotations.map((item, i) => {
                                                    if (index === i)
                                                        return {...item, label: {...item.label, text}}
                                                    return item
                                                }))
                                            }}
                                            selected={annotation.label.selected}
                                            onTextResize={(newWidth, newHeight) => {
                                                setAnnotations(annotations.map((item, i) => {
                                                    if (index === i)
                                                        return {
                                                            ...item,
                                                            label: {
                                                                ...item.label,
                                                                width: newWidth,
                                                                height: newHeight,
                                                            }
                                                        }
                                                    return item
                                                }))
                                            }}
                                            onClick={() => {
                                                setAnnotations(annotations.map((item, i) => {
                                                    if (index === i)
                                                        return {
                                                            ...item,
                                                            label: {...item.label, selected: !annotation.label.selected,}
                                                        }
                                                    return item
                                                }))
                                            }}
                                            onTextClick={(newSelected) => {
                                                setAnnotations(annotations.map((item, i) => {
                                                    if (index === i)
                                                        return {
                                                            ...item,
                                                            label: {...item.label, selected: newSelected,}
                                                        }
                                                    return item
                                                }))
                                            }}
                                            setIsDrawing={setIsDrawing}
                                            onMove={e => {
                                                const ants = annotations.map((item, i) => {
                                                    if (i === index) return {
                                                        ...item,
                                                        label: {...item.label, ...e.target.position()}
                                                    };
                                                    return item
                                                })
                                                setAnnotations(ants)
                                            }}
                                            index={index}
                                        />

                                    )}


                                    <Marker
                                        x={annotation.marker.x}
                                        y={annotation.marker.y}
                                        width={annotation.marker.width}
                                        height={annotation.marker.height}
                                        onMove={e => {
                                            const ants = annotations.map((item, i) => {
                                                if (i === index) return {
                                                    ...item,
                                                    marker: {...item.marker, ...e.target.position()}
                                                };
                                                return item
                                            })
                                            setAnnotations(ants)
                                            setSelected(index)
                                        }}
                                        setIsDrawing={setIsDrawing}
                                        selected={selected === index}
                                        setSelected={() => {
                                            if (selected === index)
                                                setSelected(null)
                                            else
                                                setSelected(index)
                                        }}
                                    />
                                </>
                            );
                        })}

                        {newRect.length > 0 && (
                            <Marker
                                x={newRect[0].x}
                                y={newRect[0].y}
                                width={newRect[0].width}
                                height={newRect[0].height}
                            />

                        )}

                    </Layer>
                </Stage>

                <div className='p-4 space-x-4 flex flex-row'>
                    <Button onClick={onBack}><img src='back-arrow-1767515-1502579.png' className='h-4 w-4'/>History</Button>
                    <div className='flex-1'/>
                    <Button variant='contained' onClick={clear}>Clear All</Button>
                    <Button variant='outlined' color={"primary"} onClick={handleExport}>Export</Button>
                </div>

            </div>
        );
    }
;

export default DrawAnnotations;