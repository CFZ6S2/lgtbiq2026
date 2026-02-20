import React from 'react';

// Componente ultra simple para probar que el tema se ve
export default function UltraSimplePrideTest() {
  return (
    <div style={{
      backgroundColor: '#121212',
      color: '#ffffff',
      minHeight: '100vh',
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{
        fontSize: '48px',
        marginBottom: '40px',
        background: 'linear-gradient(90deg, #FF0000, #FF8000, #FFFF00, #00FF00, #0080FF, #8000FF, #FF0080)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold'
      }}>
        🏳️‍🌈 PRIDE + FIREBASE TEMA 🏳️‍🌈
      </h1>
      
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '30px',
        margin: '20px auto',
        maxWidth: '600px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>✨ GLASSMORPHISM CARD ✨</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '30px' }}>
          Este es un card con efecto glassmorphism usando colores Pride
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{
            background: 'linear-gradient(135deg, #8000FF, #0080FF, #00FFFF)',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}>
            Botón Pride 1
          </button>
          
          <button style={{
            background: 'linear-gradient(135deg, #FF0000, #FF8000, #FFFF00)',
            color: 'black',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}>
            Botón Pride 2
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px', flexWrap: 'wrap' }}>
        <div style={{
          backgroundColor: 'rgba(91, 206, 250, 0.2)',
          color: '#5BCEFA',
          padding: '10px 20px',
          borderRadius: '25px',
          border: '2px solid #5BCEFA',
          fontWeight: 'bold'
        }}>
          TRANS
        </div>
        
        <div style={{
          backgroundColor: 'rgba(255, 33, 140, 0.2)',
          color: '#FF218C',
          padding: '10px 20px',
          borderRadius: '25px',
          border: '2px solid #FF218C',
          fontWeight: 'bold'
        }}>
          PAN
        </div>
        
        <div style={{
          background: 'linear-gradient(90deg, #FF0000, #FF8000, #FFFF00, #00FF00, #0080FF, #8000FF)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '25px',
          border: 'none',
          fontWeight: 'bold'
        }}>
          RAINBOW
        </div>
      </div>
      
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>🎯 COLORES PRIDE VISIBLES</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div>
            <div style={{ width: '100%', height: '30px', backgroundColor: '#FF0000', borderRadius: '5px' }}></div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Rojo Pride</small>
          </div>
          <div>
            <div style={{ width: '100%', height: '30px', backgroundColor: '#FF8000', borderRadius: '5px' }}></div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Naranja Pride</small>
          </div>
          <div>
            <div style={{ width: '100%', height: '30px', backgroundColor: '#FFFF00', borderRadius: '5px' }}></div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Amarillo Pride</small>
          </div>
          <div>
            <div style={{ width: '100%', height: '30px', backgroundColor: '#00FF00', borderRadius: '5px' }}></div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Verde Pride</small>
          </div>
          <div>
            <div style={{ width: '100%', height: '30px', backgroundColor: '#0080FF', borderRadius: '5px' }}></div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Azul Pride</small>
          </div>
          <div>
            <div style={{ width: '100%', height: '30px', backgroundColor: '#8000FF', borderRadius: '5px' }}></div>
            <small style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Morado Pride</small>
          </div>
        </div>
      </div>
      
      <p style={{
        marginTop: '40px',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px'
      }}>
        Si ves colores vibrantes y el fondo oscuro, el tema Pride + Firebase está funcionando 🎉
      </p>
    </div>
  );
}