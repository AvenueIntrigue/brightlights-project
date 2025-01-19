import { useState } from "react"
import { ArrowLeft, ArrowRight, Circle, Eclipse } from "lucide-react"


type ImageSliderProps = {

    images:{
        url: string,
        alt: string
    }[]
}

export function ImageSlider( {images}: ImageSliderProps ) {


    const [imageIndex, setImageIndex] = useState(0)

    function showNextImage(){

        setImageIndex(index => {

            if (index===images.length -1) return 0
            return index + 1
        })


    }

    function showPrevImage() {

        setImageIndex(index => {

            if (index===0) return images.length - 1
            return index - 1
        })
    }

    return(

        <div className="ImageCarousel">
            <a href="#after-image-slider-controls" className="skip-link">Skip Image Slider Controls</a>
            
                {images.map(({url, alt}, index) => (
                    <img key={url} src={url} alt={alt} aria-hidden={imageIndex !== index} className="img-slider-img" style={{translate: `${-100 * imageIndex}%` }} />
                ))}
         
            <button onClick={showPrevImage} aria-label="View Previous Image" className="img-slider-btn-l" style={{left: "0"}}><ArrowLeft aria-hidden /></button>
            <button onClick={showNextImage} aria-label="View Next Image" className="img-slider-btn-r" style={{right: "0"}}><ArrowRight aria-hidden /></button>

            <div style={{
              position: "absolute",
              bottom: ".5rem",
              left: "50%",
              translate: "-50%",
              display: "flex",
              gap: ".25rem"

            }}>
                {images.map((_, index) => (
                    <button key={index} className="img-slider-dot-btn" aria-label={`View Image ${index + 1}`} onClick={()=> setImageIndex(index)}>{index === imageIndex ? <Eclipse aria-hidden /> : <Circle />}</button>
                ))}
            </div>
            <div id="after-image-slider-controls"></div>
       </div>
    )
}